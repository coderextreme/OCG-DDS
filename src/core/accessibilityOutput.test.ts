import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignShardByConsistentHash,
  buildAccessibleEventBundle,
  describeGraphNodeAccessibility,
  formatAslOutput,
  formatProtactileCue,
  graphToMerkleRecords,
} from './accessibilityOutput';
import { createSeedOcapGraphState } from './ocapGraph';

test('Protactile Language formatter produces contact space, topographic trace, backchannel, and haptic pattern', () => {
  const cue = formatProtactileCue(
    'graph',
    'warning',
    'Capability Denied: Shard-B Operator lacks delete authority.'
  );
  assert.match(cue.contactSetup, /CONTACT-SPACE/);
  assert.match(cue.spatialZone, /Zone B/);
  assert.match(cue.topographicTrace, /blocked boundary/i);
  assert.match(cue.backchannel, /DOUBLE-TAP-HOLD/);
  assert.ok(cue.hapticPatternMs.length >= 3);
});

test('ASL Output formatter produces Topic-Comment Gloss and structured Sign Steps with Non-Manual Markers', () => {
  const asl = formatAslOutput(
    'graph',
    'success',
    'Executed batch on group of 3 nodes and arcs.'
  );
  assert.match(asl.gloss, /GROUP/);
  assert.match(asl.gloss, /\[nod\]/);
  assert.ok(asl.steps.length >= 2);
  assert.ok(asl.steps[0].handshape.length > 0);
  assert.ok(asl.steps[0].nonManualMarker.length > 0);
});

test('Accessible event bundle combines Standard, 40-cell Braille, Protactile, ASL, and SignWriting outputs', () => {
  const bundle = buildAccessibleEventBundle(
    'graph',
    'success',
    'Created arc A6 (N1 -> N6).',
    'dgs'
  );
  assert.equal(bundle.standard, 'Created arc A6 (N1 -> N6).');
  assert.ok(bundle.brailleLines.every((l) => l.length <= 40));
  assert.equal(bundle.brailleDots.length, bundle.brailleLines.length);
  assert.match(bundle.protactile.topographicTrace, /source anchor/i);
  assert.match(bundle.aslGloss, /ARC-CONNECT/);
  assert.equal(bundle.signWriting.language.code, 'DGS');
  assert.match(bundle.signWriting.fsw, /M535x540/);
});

test('Unified Graph helpers compute OCap per-node guardrails, consistent shard assignment, and Merkle records', () => {
  const seed = createSeedOcapGraphState();
  const shardBOp = seed.capabilities.find((c) => c.id === 'cap-shard-b');

  const n1Guard = describeGraphNodeAccessibility(
    seed.nodes[0], // Shard-A
    seed.arcs,
    shardBOp,
    seed.capabilities
  );
  assert.equal(n1Guard.canUpdate, false);
  assert.match(n1Guard.guardLabel, /Locked/);

  const n3Guard = describeGraphNodeAccessibility(
    seed.nodes[2], // Shard-B
    seed.arcs,
    shardBOp,
    seed.capabilities
  );
  assert.equal(n3Guard.canUpdate, true);
  assert.equal(n3Guard.canDelete, false);
  assert.equal(n3Guard.guardLabel, 'Read/Write');

  const assigned = assignShardByConsistentHash('N6', ['Shard-A', 'Shard-B', 'Shard-C']);
  assert.ok(['Shard-A', 'Shard-B', 'Shard-C'].includes(assigned));

  const merkleRecords = graphToMerkleRecords(seed.nodes, seed.arcs);
  assert.equal(Object.keys(merkleRecords).length, seed.nodes.length + seed.arcs.length);
  assert.ok('node:N1' in merkleRecords);
  assert.ok('arc:A1' in merkleRecords);
});
