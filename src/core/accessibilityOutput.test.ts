import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignShardByConsistentHash,
  buildAccessibleEventBundle,
  describeGraphNodeAccessibility,
  formatAslOutput,
  formatBrailleAnnouncement,
  formatProtactileCue,
  formatSignLanguageOutput,
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

test('DeafBlind tactile formatter supports switching between Lorm, Tactile BSL, Close-vision signing, and Tactile fingerspelling', () => {
  const lorm = formatProtactileCue('graph', 'success', 'Created arc A6.', 'en', 'db-lorm');
  const tbsl = formatProtactileCue(
    'sync',
    'warning',
    'Replica partition detected.',
    'en',
    'db-tactile-bsl'
  );
  const cvs = formatProtactileCue(
    'sharding',
    'info',
    'Rebalanced ring keys.',
    'en',
    'db-close-vision'
  );
  const tfs = formatProtactileCue(
    'capabilities',
    'success',
    'Delegated capability.',
    'en',
    'db-tactile-fingerspelling'
  );

  assert.equal(lorm.profileCode, 'LORM');
  assert.match(lorm.contactSetup, /LORM TACTILE ALPHABET/);
  assert.equal(tbsl.profileCode, 'TBSL');
  assert.match(tbsl.contactSetup, /TACTILE BSL/);
  assert.equal(cvs.profileCode, 'CVS');
  assert.match(cvs.contactSetup, /CLOSE-VISION SIGNING/);
  assert.equal(tfs.profileCode, 'TFS');
  assert.match(tfs.contactSetup, /TACTILE FINGERSPELLING/);
});

test('Braille formatter supports switching international Braille codes while staying within 40 cells per line', () => {
  const defaultLine = formatBrailleAnnouncement('graph', 'warning', 'Capability Denied');
  assert.equal(defaultLine, '[ALERT GRAPH] Capability Denied');

  const jaBundle = buildAccessibleEventBundle(
    'graph',
    'success',
    'Created arc A6 (N1 -> N3) across Shard-A and Shard-B.',
    'jsl',
    'vertical',
    'ja',
    'braille-ja',
    'db-protactile'
  );
  assert.equal(jaBundle.brailleProfile.code, 'JA');
  assert.match(jaBundle.brailleLines[0], /^\[JA OK GRAPH\]/);
  assert.ok(jaBundle.brailleLines.every((l) => l.length <= 40));

  const arBundle = buildAccessibleEventBundle(
    'sync',
    'info',
    'Merkle check OK.',
    'arsl',
    'vertical',
    'ar',
    'braille-ar',
    'db-lorm'
  );
  assert.equal(arBundle.brailleProfile.code, 'AR');
  assert.match(arBundle.brailleLines[0], /^\[AR INFO SYNC\]/);
  assert.equal(arBundle.protactile.profileCode, 'LORM');
});

test('ASL and international Sign Language formatters adapt syntax order, manual tags, and glosses', () => {
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

  const bsl = formatSignLanguageOutput(
    'graph',
    'success',
    'Created arc A6 (N1 -> N3).',
    'bsl'
  );
  assert.equal(bsl.language.code, 'BSL');
  assert.match(bsl.gloss, /^\[BSL · TOPIC-COMMENT\]/);
  assert.ok(bsl.steps.some((s) => s.handshape.includes('2H manual')));

  const jsl = formatSignLanguageOutput(
    'sync',
    'success',
    'Healed partitions and converged all CRDT replicas.',
    'jsl'
  );
  assert.equal(jsl.language.code, 'JSL');
  assert.match(jsl.gloss, /^\[JSL · SOV\]/);
  assert.ok(jsl.steps.some((s) => s.handshape.includes('1H manual')));

  const custom = formatSignLanguageOutput(
    'capabilities',
    'warning',
    'Capability Denied: lacks authority.',
    'FSL'
  );
  assert.equal(custom.language.code, 'FSL');
  assert.equal(custom.language.isCustom, true);
  assert.match(custom.gloss, /^\[FSL · TOPIC-COMMENT\]/);
});

test('Accessible event bundle combines Standard, 40-cell Braille, Protactile, ASL/Sign Language, and SignWriting outputs', () => {
  const bundle = buildAccessibleEventBundle(
    'graph',
    'success',
    'Created arc A6 (N1 -> N6).',
    'dgs'
  );
  assert.equal(bundle.standard, 'Created arc A6 (N1 -> N6).');
  assert.equal(bundle.brailleProfile.code, 'UEB');
  assert.ok(bundle.brailleLines.every((l) => l.length <= 40));
  assert.equal(bundle.brailleDots.length, bundle.brailleLines.length);
  assert.match(bundle.protactile.topographicTrace, /source anchor/i);
  assert.equal(bundle.signLanguageSpec.code, 'DGS');
  assert.match(bundle.aslGloss, /VERBINDEN|ARC-CONNECT/);
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
