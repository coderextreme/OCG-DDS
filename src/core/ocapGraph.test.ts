import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attenuateCapability,
  authorizeCapability,
  createSeedOcapGraphState,
  executeGraphBatch,
  isCapabilityActive,
  queryGraph,
  revokeCapability,
} from './ocapGraph';
import { chunkForBrailleCells, formatBrailleAnnouncement, toUnicodeBraille } from './braille';

test('Graph CRUD, group querying, and cascading node deletion work cleanly', () => {
  const seed = createSeedOcapGraphState();

  const batchRes = executeGraphBatch(
    seed.nodes,
    seed.arcs,
    [
      {
        id: 'op1',
        kind: 'create-node',
        node: {
          id: 'N6',
          label: 'EU Gateway',
          shard: 'Shard-B',
          status: 'active',
          groupTag: 'edge',
          x: 100,
          y: 220,
        },
      },
      {
        id: 'op2',
        kind: 'create-arc',
        arc: {
          id: 'A6',
          source: 'N1',
          target: 'N6',
          label: 'route-eu',
          weight: 9,
          status: 'active',
          groupTag: 'data',
        },
      },
      {
        id: 'op3',
        kind: 'update-nodes',
        nodeIds: ['N3', 'N4'],
        patch: { status: 'maintenance' },
      },
    ],
    'cap-root',
    seed.capabilities
  );

  assert.equal(batchRes.ok, true);
  assert.equal(batchRes.nodes.length, 6);
  assert.equal(batchRes.arcs.length, 6);
  assert.equal(batchRes.nodes.find((n) => n.id === 'N3')?.status, 'maintenance');

  // Query by reachability from N1 and minWeight >= 9
  const q = queryGraph(batchRes.nodes, batchRes.arcs, {
    text: '',
    shard: 'all',
    status: 'all',
    groupTag: '',
    minWeight: 9,
    reachableFromNodeId: 'N1',
  });
  assert.ok(q.arcs.some((a) => a.id === 'A6'));
  assert.ok(q.arcs.every((a) => a.weight >= 9));

  // Delete N6 -> incident arc A6 must cascade delete
  const delRes = executeGraphBatch(
    batchRes.nodes,
    batchRes.arcs,
    [{ id: 'op4', kind: 'delete-nodes', nodeIds: ['N6'] }],
    'cap-root',
    seed.capabilities
  );
  assert.equal(delRes.ok, true);
  assert.equal(delRes.nodes.some((n) => n.id === 'N6'), false);
  assert.equal(delRes.arcs.some((a) => a.id === 'A6'), false);
});

test('Object-Capability security enforces least privilege, prevents amplification, and cascades revocation', () => {
  const seed = createSeedOcapGraphState();

  // Read-only auditor cannot mutate
  const deniedUpdate = executeGraphBatch(
    seed.nodes,
    seed.arcs,
    [{ id: 'op1', kind: 'update-nodes', nodeIds: ['N3'], patch: { status: 'isolated' } }],
    'cap-auditor',
    seed.capabilities
  );
  assert.equal(deniedUpdate.ok, false);
  assert.match(deniedUpdate.error ?? '', /Capability Denied/);

  // Shard-B operator can update Shard-B nodes, but NOT Shard-A nodes
  const shardBAllowed = executeGraphBatch(
    seed.nodes,
    seed.arcs,
    [{ id: 'op1', kind: 'update-nodes', nodeIds: ['N3'], patch: { label: 'Ledger Store v2' } }],
    'cap-shard-b',
    seed.capabilities
  );
  assert.equal(shardBAllowed.ok, true);

  const shardADenied = executeGraphBatch(
    seed.nodes,
    seed.arcs,
    [{ id: 'op1', kind: 'update-nodes', nodeIds: ['N1'], patch: { label: 'Hijacked' } }],
    'cap-shard-b',
    seed.capabilities
  );
  assert.equal(shardADenied.ok, false);
  assert.match(shardADenied.error ?? '', /confined to Shard-B/);

  // Atomic rollback: if op1 is allowed and op2 is denied, op1 must NOT persist
  const atomicRollback = executeGraphBatch(
    seed.nodes,
    seed.arcs,
    [
      { id: 'op1', kind: 'update-nodes', nodeIds: ['N3'], patch: { label: 'Partial' } },
      { id: 'op2', kind: 'delete-nodes', nodeIds: ['N3'] }, // Shard-B operator lacks delete!
    ],
    'cap-shard-b',
    seed.capabilities
  );
  assert.equal(atomicRollback.ok, false);
  assert.equal(atomicRollback.nodes.find((n) => n.id === 'N3')?.label, 'Ledger Store');

  // Cannot amplify scope or rights when attenuating
  const amplifyAttempt = attenuateCapability('cap-shard-b', seed.capabilities, {
    id: 'cap-bad',
    label: 'Escalated',
    holder: 'Attacker',
    rights: ['read', 'delete'],
    scope: 'Shard-B',
  });
  assert.equal(amplifyAttempt.ok, false);

  // Valid attenuation + transitive revocation
  const childRes = attenuateCapability('cap-shard-b', seed.capabilities, {
    id: 'cap-shard-b-child',
    label: 'Shard-B Updater',
    holder: 'Worker',
    rights: ['read', 'update'],
    scope: 'Shard-B',
  });
  assert.equal(childRes.ok, true);
  if (!childRes.ok) return;

  const capsWithChild = [...seed.capabilities, childRes.token];
  assert.equal(isCapabilityActive('cap-shard-b-child', capsWithChild), true);

  const revoked = revokeCapability(capsWithChild, 'cap-shard-b', 'cap-root');
  assert.equal(revoked.ok, true);
  if (!revoked.ok) return;

  assert.equal(isCapabilityActive('cap-shard-b-child', revoked.caps), false);
  const afterRevoke = authorizeCapability('cap-shard-b-child', revoked.caps, 'update', ['Shard-B']);
  assert.equal(afterRevoke.allowed, false);
});

test('Braille formatter splits text cleanly at 40-cell boundaries and maps Unicode Braille', () => {
  const formatted = formatBrailleAnnouncement('graph', 'success', 'Updated 3 nodes in Shard-B.');
  assert.equal(formatted, '[OK GRAPH] Updated 3 nodes in Shard-B.');

  const chunks = chunkForBrailleCells(
    'Selected nodes N3 and N4 in Shard-B for batch status update',
    40
  );
  assert.ok(chunks.length >= 2);
  for (const line of chunks) {
    assert.ok(line.length <= 40);
  }

  const unicode = toUnicodeBraille('ok');
  assert.equal(unicode, '⠕⠅');
});
