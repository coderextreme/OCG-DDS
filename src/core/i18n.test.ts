import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveUiLocale,
  runLanguageSelfTestSuite,
  translateUi,
  UI_LOCALES,
} from './i18n';

test('UI_LOCALES provides 24 international languages including LTR and RTL scripts', () => {
  assert.equal(UI_LOCALES.length, 24);
  const ar = resolveUiLocale('ar');
  assert.equal(ar.dir, 'rtl');
  assert.equal(translateUi('ar', 'navGraph'), 'مساحة الرسم البياني');

  const he = resolveUiLocale('he');
  assert.equal(he.dir, 'rtl');

  const ja = resolveUiLocale('ja');
  assert.equal(ja.dir, 'ltr');
  assert.equal(ja.recommendedSignLanguage, 'jsl');
  assert.equal(translateUi('ja', 'navGraph'), 'グラフ作業領域');

  // Unknown locale safely falls back to English
  assert.equal(translateUi('xx-unknown', 'navGraph'), 'Graph Workspace');
});

test('runLanguageSelfTestSuite verifies all 24 UI locales and 10+ SignWriting sign languages pass cleanly', () => {
  const result = runLanguageSelfTestSuite();
  assert.equal(result.uiLocalesTested, 24);
  assert.equal(result.uiLocalesPassed, 24);
  assert.ok(result.signLanguagesTested >= 15);
  assert.equal(result.signLanguagesPassed, result.signLanguagesTested);
  assert.deepEqual(result.rtlLocalesVerified, ['ar', 'he']);
});
