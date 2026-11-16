import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Globe, Play, Sparkles, X } from 'lucide-react';
import {
  BRAILLE_LANGUAGE_OPTIONS,
  DEAFBLIND_COMMUNICATION_OPTIONS,
} from '../core/accessibilityLanguages';
import {
  resolveBrailleProfile,
  resolveDeafblindProfile,
  type AccessibleOutputChannel,
} from '../core/accessibilityOutput';
import {
  formatUi,
  resolveUiLocale,
  resolveUiLocaleForOutputSelection,
  runLanguageSelfTestSuite,
  translateUi,
  UI_LOCALES,
  type LanguageSelfTestResult,
  type SupportedUiLocale,
} from '../core/i18n';
import { resolveSignLanguage, SIGN_LANGUAGE_PRESETS } from '../core/signWriting';

interface LanguageTestDialogProps {
  open: boolean;
  uiLocale: SupportedUiLocale;
  outputChannel: AccessibleOutputChannel;
  brailleProfileId: string;
  deafblindProfileId: string;
  signLanguage: string;
  onChangeUiLocale: (locale: SupportedUiLocale, pairSignLanguage: boolean) => void;
  onChangeOutputChannel: (channel: AccessibleOutputChannel) => void;
  onChangeBrailleProfile: (profileId: string) => void;
  onChangeDeafblindProfile: (profileId: string) => void;
  onChangeSignLanguage: (lang: string) => void;
  onDispatchSampleEvent: (severity: 'info' | 'warning' | 'success', summary: string) => void;
  onClose: () => void;
}

export const LanguageTestDialog: React.FC<LanguageTestDialogProps> = ({
  open,
  uiLocale,
  outputChannel,
  brailleProfileId,
  deafblindProfileId,
  signLanguage,
  onChangeUiLocale,
  onChangeOutputChannel,
  onChangeBrailleProfile,
  onChangeDeafblindProfile,
  onChangeSignLanguage,
  onDispatchSampleEvent,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [pairSignLang, setPairSignLang] = useState<boolean>(true);
  const [customSignInput, setCustomSignInput] = useState<string>('');
  const [selfTestResult, setSelfTestResult] = useState<LanguageSelfTestResult | null>(
    null
  );

  const activeLocaleSpec = resolveUiLocale(uiLocale);
  const activeBraille = resolveBrailleProfile(brailleProfileId);
  const activeDeafblind = resolveDeafblindProfile(deafblindProfileId);
  const activeSignSpec = resolveSignLanguage(signLanguage);

  const outputModes: Array<{ id: AccessibleOutputChannel; label: string }> = [
    { id: 'standard', label: translateUi(uiLocale, 'channelStandard') },
    {
      id: 'braille',
      label: `${translateUi(uiLocale, 'channelBraille')} (40-cell · ${activeBraille.code})`,
    },
    {
      id: 'protactile',
      label: `${translateUi(uiLocale, 'channelProtactile')} (${activeDeafblind.code})`,
    },
    {
      id: 'asl',
      label: `${translateUi(uiLocale, 'channelAsl')} (${activeSignSpec.code})`,
    },
    {
      id: 'signwriting',
      label: `${translateUi(uiLocale, 'channelSignWriting')} (FSW + SWU · ${activeSignSpec.code})`,
    },
  ];

  const activeOutputLabel = (() => {
    switch (outputChannel) {
      case 'braille':
        return `${translateUi(uiLocale, 'channelBraille')} · ${activeBraille.code}`;
      case 'protactile':
        return `${translateUi(uiLocale, 'channelProtactile')} · ${activeDeafblind.code}`;
      case 'asl':
        return `${translateUi(uiLocale, 'channelAsl')} · ${activeSignSpec.code}`;
      case 'signwriting':
        return `${translateUi(uiLocale, 'channelSignWriting')} · ${activeSignSpec.code}`;
      default:
        return translateUi(uiLocale, 'channelStandard');
    }
  })();

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isPresetSign = SIGN_LANGUAGE_PRESETS.some(
    (s) => s.id.toLowerCase() === signLanguage.toLowerCase()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-test-dialog-title"
        data-testid="language-test-dialog"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div>
            <h2
              id="language-test-dialog-title"
              className="inline-flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]"
            >
              <Globe className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
              <span>{translateUi(uiLocale, 'langLabTitle')}</span>
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {translateUi(uiLocale, 'langLabSubtitle')}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={translateUi(uiLocale, 'closeDialogAria')}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Active Language & Document Metadata */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-4">
            <label
              htmlFor="lab-ui-locale-select"
              className="block text-xs font-semibold text-[var(--text-primary)]"
            >
              {translateUi(uiLocale, 'labStep1Title')}
            </label>
            <select
              id="lab-ui-locale-select"
              value={uiLocale}
              onChange={(e) =>
                onChangeUiLocale(e.target.value as SupportedUiLocale, pairSignLang)
              }
              className="min-h-[38px] w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]"
            >
              {UI_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.nativeName} · {loc.englishName} ({loc.code}, {loc.dir.toUpperCase()})
                </option>
              ))}
            </select>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={pairSignLang}
                onChange={(e) => setPairSignLang(e.target.checked)}
              />
              <span>
                {formatUi(uiLocale, 'labAutoPairSign', {
                  signLang: activeLocaleSpec.recommendedSignLanguage.toUpperCase(),
                })}
              </span>
            </label>

            <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5 text-[11px]">
              <div className="font-mono text-[var(--text-muted)]">
                Active: lang=&quot;{activeLocaleSpec.code}&quot; · dir=&quot;{activeLocaleSpec.dir}&quot;
              </div>
              <div className="mt-1 text-[var(--text-secondary)]">
                {activeLocaleSpec.brailleGuideNote}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-4">
            <label
              htmlFor="lab-output-channel-select"
              className="block text-xs font-semibold text-[var(--text-primary)]"
            >
              {translateUi(uiLocale, 'labStep2Title')}
            </label>
            <select
              id="lab-output-channel-select"
              value={outputChannel}
              onChange={(e) =>
                onChangeOutputChannel(e.target.value as AccessibleOutputChannel)
              }
              className="min-h-[38px] w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]"
            >
              {outputModes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="lab-braille-select"
                  className="mb-1 block text-[11px] font-semibold text-[var(--text-primary)]"
                >
                  {translateUi(uiLocale, 'brailleCodeSelectLabel')}
                </label>
                <select
                  id="lab-braille-select"
                  value={activeBraille.id}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    onChangeBrailleProfile(nextId);
                    onChangeOutputChannel('braille');
                    const mappedLocale = resolveUiLocaleForOutputSelection(
                      'braille',
                      uiLocale,
                      nextId,
                      deafblindProfileId,
                      signLanguage
                    );
                    if (mappedLocale !== uiLocale) {
                      onChangeUiLocale(mappedLocale, false);
                    }
                  }}
                  className="min-h-[34px] w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
                >
                  {BRAILLE_LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.code} · {opt.nativeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="lab-tactile-select"
                  className="mb-1 block text-[11px] font-semibold text-[var(--text-primary)]"
                >
                  {translateUi(uiLocale, 'tactileMethodSelectLabel')}
                </label>
                <select
                  id="lab-tactile-select"
                  value={activeDeafblind.id}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    onChangeDeafblindProfile(nextId);
                    onChangeOutputChannel('protactile');
                    const mappedLocale = resolveUiLocaleForOutputSelection(
                      'protactile',
                      uiLocale,
                      brailleProfileId,
                      nextId,
                      signLanguage
                    );
                    if (mappedLocale !== uiLocale) {
                      onChangeUiLocale(mappedLocale, false);
                    }
                  }}
                  className="min-h-[34px] w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
                >
                  {DEAFBLIND_COMMUNICATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.code} · {opt.nativeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label
              htmlFor="lab-sign-language-select"
              className="block text-xs font-semibold text-[var(--text-primary)]"
            >
              {translateUi(uiLocale, 'signLanguageSelectLabel')}
            </label>
            <select
              id="lab-sign-language-select"
              value={isPresetSign ? signLanguage.toLowerCase() : '__custom__'}
              onChange={(e) => {
                if (e.target.value !== '__custom__') {
                  const nextSign = e.target.value;
                  const targetChannel =
                    outputChannel === 'asl' || outputChannel === 'signwriting'
                      ? outputChannel
                      : 'signwriting';
                  onChangeSignLanguage(nextSign);
                  if (outputChannel !== 'asl' && outputChannel !== 'signwriting') {
                    onChangeOutputChannel('signwriting');
                  }
                  const mappedLocale = resolveUiLocaleForOutputSelection(
                    targetChannel,
                    uiLocale,
                    brailleProfileId,
                    deafblindProfileId,
                    nextSign
                  );
                  if (mappedLocale !== uiLocale) {
                    onChangeUiLocale(mappedLocale, false);
                  }
                }
              }}
              className="min-h-[38px] w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]"
            >
              {SIGN_LANGUAGE_PRESETS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.nativeName} ({s.syntaxOrder.toUpperCase()})
                </option>
              ))}
              {!isPresetSign && (
                <option value="__custom__">
                  Custom ({signLanguage})
                </option>
              )}
            </select>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customSignInput.trim()) {
                  const nextSign = customSignInput.trim();
                  const targetChannel =
                    outputChannel === 'asl' || outputChannel === 'signwriting'
                      ? outputChannel
                      : 'signwriting';
                  onChangeSignLanguage(nextSign);
                  onChangeOutputChannel(targetChannel);
                  const mappedLocale = resolveUiLocaleForOutputSelection(
                    targetChannel,
                    uiLocale,
                    brailleProfileId,
                    deafblindProfileId,
                    nextSign
                  );
                  if (mappedLocale !== uiLocale) {
                    onChangeUiLocale(mappedLocale, false);
                  }
                }
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                aria-label={translateUi(uiLocale, 'swCustomInputAria')}
                placeholder={translateUi(uiLocale, 'labCustomSignPlaceholder')}
                value={customSignInput}
                onChange={(e) => setCustomSignInput(e.target.value)}
                className="min-h-[34px] flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
              />
              <button
                type="submit"
                className="min-h-[34px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
              >
                {translateUi(uiLocale, 'labUseBtn')}
              </button>
            </form>
          </div>
        </div>

        {/* Live Event Simulation Triggers */}
        <div className="mt-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-4">
          <h3 className="text-xs font-semibold text-[var(--text-primary)]">
            {formatUi(uiLocale, 'labStep3Title', {
              nativeName: activeLocaleSpec.nativeName,
              channel: activeOutputLabel,
            })}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {translateUi(uiLocale, 'labStep3Desc')}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onDispatchSampleEvent('success', activeLocaleSpec.sampleEventSummary)
              }
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {formatUi(uiLocale, 'labTestLocalizedBtn', {
                  code: activeLocaleSpec.code.toUpperCase(),
                })}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onDispatchSampleEvent('success', 'Created arc A6 (N1 -> N3).')
              }
              className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              {translateUi(uiLocale, 'labTestArcBtn')}
            </button>

            <button
              type="button"
              onClick={() =>
                onDispatchSampleEvent(
                  'warning',
                  'Capability Denied: Shard-B Operator lacks delete authority.'
                )
              }
              className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              {translateUi(uiLocale, 'labTestDeniedBtn')}
            </button>

            <button
              type="button"
              onClick={() =>
                onDispatchSampleEvent(
                  'success',
                  'Executed batch on group of 3 nodes and arcs.'
                )
              }
              className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              {translateUi(uiLocale, 'labTestBatchBtn')}
            </button>

            <button
              type="button"
              onClick={() =>
                onDispatchSampleEvent(
                  'success',
                  'Healed partitions and converged all CRDT graph replicas.'
                )
              }
              className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              {translateUi(uiLocale, 'labTestCrdtBtn')}
            </button>
          </div>
        </div>

        {/* Automated All-Language Verification Matrix */}
        <div className="mt-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                {translateUi(uiLocale, 'labStep4Title')}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {translateUi(uiLocale, 'labStep4Desc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelfTestResult(runLanguageSelfTestSuite())}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--accent-primary)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{translateUi(uiLocale, 'labRunCheckBtn')}</span>
            </button>
          </div>

          {selfTestResult && (
            <div data-testid="language-selftest-results" className="mt-3 space-y-2.5">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {formatUi(uiLocale, 'labUiPassSummary', {
                    passed: selfTestResult.uiLocalesPassed,
                    tested: selfTestResult.uiLocalesTested,
                  })}
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatUi(uiLocale, 'labSwPassSummary', {
                    passed: selfTestResult.signLanguagesPassed,
                    tested: selfTestResult.signLanguagesTested,
                  })}
                </span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {formatUi(uiLocale, 'labRtlVerified', {
                    rtl: selfTestResult.rtlLocalesVerified.join(', '),
                  })}
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                      <th scope="col" className="px-2.5 py-1.5">{translateUi(uiLocale, 'labColTarget')}</th>
                      <th scope="col" className="px-2.5 py-1.5">{translateUi(uiLocale, 'labColType')}</th>
                      <th scope="col" className="px-2.5 py-1.5">{translateUi(uiLocale, 'labColStatus')}</th>
                      <th scope="col" className="px-2.5 py-1.5">{translateUi(uiLocale, 'labColVerified')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selfTestResult.details.map((row) => (
                      <tr
                        key={`${row.category}-${row.id}`}
                        className="border-b border-[var(--border-hairline)] last:border-b-0"
                      >
                        <td className="px-2.5 py-1.5 font-semibold text-[var(--text-primary)]">
                          {row.label}
                        </td>
                        <td className="px-2.5 py-1.5 font-mono text-[var(--text-muted)]">
                          {row.category}
                        </td>
                        <td className="px-2.5 py-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                          {row.ok ? translateUi(uiLocale, 'labPass') : translateUi(uiLocale, 'labFail')}
                        </td>
                        <td dir="ltr" className="px-2.5 py-1.5 font-mono text-[var(--text-secondary)]">
                          {row.sampleOutput}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end border-t border-[var(--border-hairline)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
          >
            {translateUi(uiLocale, 'doneBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
