import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVirtualRing,
  computeRingMetrics,
  createKeyEntry,
  createSeedRingState,
  hashString32,
  resolveKeyPlacement,
} from './hashRing';
import {
  addOrSetItem,
  areReplicasConverged,
  compareVectorClocks,
  createSeedCrdtReplicas,
  getActiveOrSetItems,
  gossipConvergeAll,
  mergeReplicaState,
  removeOrSetItem,
  setLwwRegister,
} from './crdt';
import {
  buildMerkleTree,
  createSeedMerkleRecords,
  diffMerkleTrees,
  getBucketIndex,
  syncDivergentBuckets,
} from './merkle';
import {
  createSeedQuorumState,
  executeQuorumRead,
  executeQuorumWrite,
  isStrongQuorum,
} from './quorum';

test('Consistent hash ring deterministically maps keys and remaps when a node fails', () => {
  const seed = createSeedRingState();
  assert.equal(hashString32('user:101'), hashString32('user:101'));

  const vnodesAll = buildVirtualRing(seed.nodes);
  const placementsAll = seed.entries.map((e) =>
    resolveKeyPlacement(e, vnodesAll, seed.replicationFactor)
  );

  for (const p of placementsAll) {
    assert.equal(p.allAssignedNodeIds.length, 2);
    assert.notEqual(p.primaryNodeId, null);
    assert.equal(new Set(p.allAssignedNodeIds).size, 2);
  }

  // Fail Node-B
  const degradedNodes = seed.nodes.map((n) =>
    n.id === 'Node-B' ? { ...n, status: 'offline' as const } : n
  );
  const vnodesDegraded = buildVirtualRing(degradedNodes);
  const placementsDegraded = seed.entries.map((e) =>
    resolveKeyPlacement(e, vnodesDegraded, seed.replicationFactor)
  );

  for (const p of placementsDegraded) {
    assert.ok(!p.allAssignedNodeIds.includes('Node-B'));
    assert.equal(p.allAssignedNodeIds.length, 2);
  }

  const metrics = computeRingMetrics(degradedNodes, placementsDegraded, vnodesDegraded);
  assert.equal(metrics.healthyNodeCount, 3);
  assert.equal(metrics.totalKeys, seed.entries.length);
});

test('Consistent hash ring handles empty healthy cluster gracefully', () => {
  const seed = createSeedRingState();
  const offlineNodes = seed.nodes.map((n) => ({ ...n, status: 'offline' as const }));
  const vnodes = buildVirtualRing(offlineNodes);
  assert.equal(vnodes.length, 0);

  const placement = resolveKeyPlacement(createKeyEntry('k1', 'v1'), vnodes, 2);
  assert.equal(placement.primaryNodeId, null);
  assert.deepEqual(placement.allAssignedNodeIds, []);
});

test('CRDT OR-Set and LWW-Map satisfy commutativity, idempotency, and partition convergence', () => {
  const replicas = createSeedCrdtReplicas();
  assert.equal(areReplicasConverged(replicas), true);

  // Partition R3
  const r1 = addOrSetItem(replicas[0], 'policy:strict', 10);
  const r2 = setLwwRegister(replicas[1], 'max_connections', '4096');
  let r3 = { ...replicas[2], partitioned: true };
  r3 = removeOrSetItem(r3, 'region:eu-ready');
  r3 = addOrSetItem(r3, 'edge:cache', 11);

  // Concurrent clocks between R1 and R3
  assert.equal(compareVectorClocks(r1.vectorClock, r3.vectorClock), 'concurrent');

  // Verify commutativity of mergeReplicaState
  const merge13 = mergeReplicaState(r1, r3);
  const merge31 = mergeReplicaState(r3, r1);
  assert.deepEqual(getActiveOrSetItems(merge13), getActiveOrSetItems(merge31));

  // Verify idempotency
  const mergeIdem = mergeReplicaState(merge13, merge13);
  assert.deepEqual(getActiveOrSetItems(mergeIdem), getActiveOrSetItems(merge13));

  // Heal partition and gossip converge all
  const healed = [r1, r2, { ...r3, partitioned: false }];
  const converged = gossipConvergeAll(healed);
  assert.equal(areReplicasConverged(converged), true);

  const finalItems = getActiveOrSetItems(converged[0]);
  assert.ok(finalItems.includes('policy:strict'));
  assert.ok(finalItems.includes('edge:cache'));
  assert.ok(!finalItems.includes('region:eu-ready'));
  assert.equal(converged[2].lwwMap['max_connections'].value, '4096');
});

test('Merkle Tree detects single divergent bucket in fewer comparisons than linear scan and repairs selectively', () => {
  const { replicaA, replicaB } = createSeedMerkleRecords();
  const mutatedB = { ...replicaB, 'acct:003': 'suspended' };

  const treeA = buildMerkleTree(replicaA);
  const treeB = buildMerkleTree(mutatedB);
  assert.notEqual(treeA.hash, treeB.hash);

  const diff = diffMerkleTrees(treeA, treeB, Object.keys(replicaA).length);
  assert.equal(diff.inSync, false);
  const expectedBucket = getBucketIndex('acct:003');
  assert.deepEqual(diff.divergentBucketIndices, [expectedBucket]);
  // In an 8-leaf binary tree (depth 3), single-leaf diff inspects 1 root + 2 L1 + 2 L2 + 2 L3 = 7 nodes (< 16 linear entries)
  assert.ok(diff.comparisonsPerformed < Object.keys(replicaA).length);

  const repairedB = syncDivergentBuckets(replicaA, mutatedB, diff.divergentBucketIndices);
  const treeBRepaired = buildMerkleTree(repairedB);
  assert.equal(treeA.hash, treeBRepaired.hash);
  const postDiff = diffMerkleTrees(treeA, treeBRepaired, Object.keys(replicaA).length);
  assert.equal(postDiff.inSync, true);
});

test('Quorum W+R>N prevents stale reads while W+R<=N allows stale reads and supports read-repair', () => {
  const seed = createSeedQuorumState();
  assert.equal(isStrongQuorum({ n: 5, w: 3, r: 3 }), true);
  assert.equal(isStrongQuorum({ n: 5, w: 2, r: 2 }), false);

  // Weak quorum write W=2 starting at index 0 -> updates Q1, Q2 to v2
  const weakConfig = { n: 5, w: 2, r: 2 };
  const writeRes = executeQuorumWrite(seed.nodes, weakConfig, 'v2-update', 1, 0);
  assert.equal(writeRes.success, true);
  assert.equal(writeRes.writtenVersion, 2);

  // Weak quorum read R=2 starting at index 2 -> hits Q3, Q4 (still v1) -> stale read!
  const staleRead = executeQuorumRead(
    writeRes.nodes,
    weakConfig,
    writeRes.writtenVersion,
    false,
    2
  );
  assert.equal(staleRead.success, true);
  assert.equal(staleRead.isStaleRead, true);
  assert.equal(staleRead.returnedVersion, 1);

  // Strong quorum W=3, R=3 guarantees overlap and fresh read
  const strongConfig = { n: 5, w: 3, r: 3 };
  const strongWrite = executeQuorumWrite(seed.nodes, strongConfig, 'v2-strong', 1, 0);
  const freshRead = executeQuorumRead(
    strongWrite.nodes,
    strongConfig,
    strongWrite.writtenVersion,
    true,
    2
  );
  assert.equal(freshRead.success, true);
  assert.equal(freshRead.isStaleRead, false);
  assert.equal(freshRead.returnedVersion, 2);
  assert.ok(freshRead.repairedNodeIds.length > 0);
});
