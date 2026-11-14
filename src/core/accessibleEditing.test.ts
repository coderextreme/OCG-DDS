import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dotsToBrailleCell,
  executeAccessibleCommand,
  fromUnicodeBraille,
  type AccessibleClusterState,
} from './accessibleEditing';
import { toUnicodeBraille, graphToMerkleRecords } from './accessibilityOutput';
import { createSeedCrdtReplicas } from './crdt';
import { createSeedRingState } from './hashRing';
import { createSeedOcapGraphState } from './ocapGraph';
import { createSeedQuorumState } from './quorum';

function makeInitialState(): AccessibleClusterState {
  const graph = createSeedOcapGraphState();
  const ring = createSeedRingState();
  const quorum = createSeedQuorumState();
  return {
    graphNodes: graph.nodes,
    graphArcs: graph.arcs,
    selectedNodeIds: ['N1', 'N2'],
    selectedArcIds: ['A1'],
    capabilities: graph.capabilities,
    activeCapabilityId: graph.activeCapabilityId,
    ringNodes: ring.nodes,
    ringEntries: ring.entries,
    replicationFactor: ring.replicationFactor,
    crdtReplicas: createSeedCrdtReplicas(),
    merkleReplicaB: graphToMerkleRecords(graph.nodes, graph.arcs),
    quorumConfig: quorum.config,
    quorumNodes: quorum.nodes,
    quorumVersion: quorum.latestWrittenVersion,
  };
}

test('6-dot Perkins chords and Unicode Braille round-trip cleanly into ASCII commands', () => {
  // Dot 1 = 'a', Dots 1-2 = 'b', Dots 1-4 = 'c', Dots 3-4-5-6 = number indicator
  const aCell = dotsToBrailleCell([1]);
  assert.equal(aCell.unicode, '⠁');
  assert.equal(aCell.ascii, 'a');

  const numIndicator = dotsToBrailleCell([3, 4, 5, 6]);
  assert.equal(numIndicator.isNumberIndicator, true);

  const cmd = 'add node n6 cache shard-b';
  const braille = toUnicodeBraille(cmd);
  assert.equal(fromUnicodeBraille(braille), cmd);
});

test('Accessible command executes Unicode Braille batch graph edits under OCap enforcement', () => {
  const init = makeInitialState();
  const brailleBatch = toUnicodeBraille(
    'add node N6 Gateway Shard-B edge | add arc A6 N3->N6 mirror w=7'
  );
  const res = executeAccessibleCommand(brailleBatch, init);
  assert.equal(res.ok, true);
  assert.ok(res.nextState.graphNodes.some((n) => n.id.toLowerCase() === 'n6'));
  assert.ok(res.nextState.graphArcs.some((a) => a.id.toLowerCase() === 'a6'));

  // Now test OCap denial under Shard-B Operator for Shard-A node update
  const restricted = { ...init, activeCapabilityId: 'cap-shard-b' };
  const denied = executeAccessibleCommand('update node N1 status=isolated', restricted);
  assert.equal(denied.ok, false);
  assert.equal(denied.severity, 'warning');
  assert.match(denied.summary, /Capability Denied/i);
});

test('ASL topic-comment command syntax edits graph nodes, capabilities, and data structures', () => {
  const init = makeInitialState();

  // ASL Topic-Comment order for updating node
  const nodeEdit = executeAccessibleCommand(
    'NODE N3 UPDATE label="Core Ledger" status=maintenance',
    init
  );
  assert.equal(nodeEdit.ok, true);
  const n3 = nodeEdit.nextState.graphNodes.find((n) => n.id === 'N3');
  assert.equal(n3?.label, 'Core Ledger');
  assert.equal(n3?.status, 'maintenance');

  // Edit capability metadata non-amplifying
  const capEdit = executeAccessibleCommand(
    'cap edit cap-shard-b label="Shard-B Steward" holder="Zone B Operator"',
    nodeEdit.nextState
  );
  assert.equal(capEdit.ok, true);
  const capB = capEdit.nextState.capabilities.find((c) => c.id === 'cap-shard-b');
  assert.equal(capB?.label, 'Shard-B Steward');

  // Edit CRDT, Ring, and Quorum via commands
  const crdtRes = executeAccessibleCommand('crdt add R1 deaf-blind-edit', capEdit.nextState);
  assert.equal(crdtRes.ok, true);
  const ringRes = executeAccessibleCommand('ring put key:777 synced', crdtRes.nextState);
  assert.equal(ringRes.ok, true);
  assert.ok(ringRes.nextState.ringEntries.some((e) => e.key === 'key:777'));
  const qRes = executeAccessibleCommand('quorum set w=4 r=2', ringRes.nextState);
  assert.equal(qRes.ok, true);
  assert.equal(qRes.nextState.quorumConfig.w, 4);
  assert.equal(qRes.nextState.quorumConfig.r, 2);
});
