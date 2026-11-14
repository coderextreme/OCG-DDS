import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSignWritingOutput,
  resolveSignLanguage,
  SIGN_LANGUAGE_PRESETS,
} from './signWriting';

test('SIGN_LANGUAGE_PRESETS covers major international sign languages and resolves arbitrary custom languages', () => {
  assert.ok(SIGN_LANGUAGE_PRESETS.length >= 10);
  const bsl = resolveSignLanguage('bsl');
  assert.equal(bsl.code, 'BSL');
  assert.equal(bsl.alphabetType, 'two-handed');
  assert.equal(bsl.isCustom, false);

  const custom = resolveSignLanguage('Kenyan Sign Language');
  assert.equal(custom.isCustom, true);
  assert.ok(custom.name.includes('Kenyan Sign Language'));
  assert.ok(custom.code.length >= 2);

  const isoCustom = resolveSignLanguage('fsl', 'horizontal');
  assert.equal(isoCustom.isCustom, true);
  assert.equal(isoCustom.code, 'FSL');
  assert.equal(isoCustom.writingDirection, 'horizontal');
});

test('formatSignWritingOutput generates valid FSW spatial box strings and Unicode U+1D800-1DAAF SWU characters', () => {
  const seq = formatSignWritingOutput(
    'graph',
    'warning',
    'Capability Denied: Shard-B Operator lacks delete authority.',
    'lsf'
  );
  assert.equal(seq.language.code, 'LSF');
  assert.equal(seq.boxes.length, 3);
  assert.match(seq.localizedGlossLine, /CLÉ-AUTORITÉ/);
  assert.match(seq.localizedGlossLine, /INTERDIT/);

  for (const box of seq.boxes) {
    assert.match(box.fswToken, /^M\d+x\d+(S[0-9a-f]{5}\d+x\d+)+$/i);
    const codePoints = Array.from(box.swuChars).map((c) => c.codePointAt(0) ?? 0);
    assert.ok(codePoints.length >= 3);
    assert.ok(codePoints.every((cp) => cp >= 0x1d800 && cp <= 0x1daaf));
    assert.ok(box.ariaDescription.includes(box.localizedGloss));
  }
});

test('SOV international sign languages (JSL / DGS) place verb/action sign final in multi-step events', () => {
  const jslArc = formatSignWritingOutput(
    'graph',
    'success',
    'Created arc A6 (N1 -> N6).',
    'jsl'
  );
  assert.equal(jslArc.language.code, 'JSL');
  assert.equal(jslArc.boxes[0].semanticKey, 'node-pair');
  assert.equal(jslArc.boxes[2].semanticKey, 'connect');
  assert.match(jslArc.localizedGlossLine, /接続/);

  const customKsl = formatSignWritingOutput(
    'graph',
    'success',
    'Executed batch on group of 3 nodes.',
    'KSL'
  );
  assert.equal(customKsl.language.code, 'KSL');
  assert.match(customKsl.localizedGlossLine, /\[KSL\]/);
  assert.ok(customKsl.fsw.includes('M535x540'));
});
