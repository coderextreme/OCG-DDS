import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCESSIBILITY_LANGUAGE_OPTIONS,
  BRAILLE_LANGUAGE_OPTIONS,
  DEAFBLIND_COMMUNICATION_OPTIONS,
  findAccessibilityLanguageOption,
  ACCESSIBILITY_PROFILE_LABELS,
} from './accessibilityLanguages';
import { SIGN_LANGUAGE_PRESETS, resolveSignLanguage } from './signWriting';

test('international braille profiles are separately identified from sign languages', () => {
  assert.ok(BRAILLE_LANGUAGE_OPTIONS.length >= 10);
  assert.ok(BRAILLE_LANGUAGE_OPTIONS.every((item) => item.kind === 'braille'));
  assert.ok(BRAILLE_LANGUAGE_OPTIONS.every((item) => item.outputChannel === 'braille'));
});

test('deafblind communication profiles are represented as methods, not sign languages', () => {
  assert.ok(DEAFBLIND_COMMUNICATION_OPTIONS.length >= 7);
  assert.ok(DEAFBLIND_COMMUNICATION_OPTIONS.every((item) => item.kind === 'deafblind'));
  assert.ok(DEAFBLIND_COMMUNICATION_OPTIONS.every((item) => item.outputChannel === 'protactile'));
  assert.ok(findAccessibilityLanguageOption('db-lorm'));
  assert.ok(findAccessibilityLanguageOption('db-protactile'));
});

test('international sign language presets resolve independently', () => {
  for (const id of ['nzsl', 'csl', 'tsl', 'ksl', 'sasl', 'isl-in', 'bds', 'lis', 'ngt', 'sts', 'pjm', 'isl-ie']) {
    assert.ok(SIGN_LANGUAGE_PRESETS.some((preset) => preset.id === id), `missing ${id}`);
    assert.equal(resolveSignLanguage(id).id, id);
  }
});

test('blind, deaf and deafblind profile labels cover all supported UI locales', () => {
  assert.equal(Object.keys(ACCESSIBILITY_PROFILE_LABELS).length, 24);
  for (const locale of ['en', 'es', 'fr', 'de', 'ar', 'he', 'hi', 'bn', 'zh-Hans', 'zh-Hant', 'ja', 'ko']) {
    assert.ok(ACCESSIBILITY_PROFILE_LABELS[locale].label.length > 0);
  }
});
