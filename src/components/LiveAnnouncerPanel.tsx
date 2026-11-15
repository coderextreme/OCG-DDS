import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hand,
  Info,
  Trash2,
  Vibrate,
} from 'lucide-react';
import {
  buildAccessibleEventBundle,
  type AccessibleOutputChannel,
} from '../core/accessibilityOutput';
import { translateUi, type SupportedUiLocale } from '../core/i18n';
import {
  SIGN_LANGUAGE_PRESETS,
  type SignWritingDirection,
} from '../core/signWriting';
import type { AuditEvent, SystemModuleId } from '../types/system';
import { SignWritingLane } from './SignWritingLane';

interface LiveAnnouncerPanelProps {
  activeModule: SystemModuleId;
  latestSeverity: 'info' | 'warning' | 'success';
  latestAnnouncement: string;
  outputChannel: AccessibleOutputChannel;
  onChangeOutputChannel: (channel: AccessibleOutputChannel) => void;
  signLanguage: string;
  onChangeSignLanguage: (lang: string) => void;
  uiLocale?: SupportedUiLocale;
  events: AuditEvent[];
  onClearEvents: () => void;
}

const MODULE_LABELS: Record<SystemModuleId, string> = {
  graph: 'Graph Workspace',
  sync: 'Sync & Quorum',
  sharding: 'Hash Sharding',
  capabilities: 'Capabilities',
};

const CHANNEL_LABELS: Array<{
  id: AccessibleOutputChannel;
  label: string;
  ariaLabel: string;
}> = [
  { id: 'standard', label: 'Std', ariaLabel: 'Inspect Standard output' },
  { id: 'braille', label: 'Braille', ariaLabel: 'Inspect Braille output' },
  { id: 'protactile', label: 'PT', ariaLabel: 'Inspect Protactile output' },
  { id: 'asl', label: 'ASL', ariaLabel: 'Inspect ASL output' },
  { id: 'signwriting', label: 'SignW', ariaLabel: 'Inspect SignWriting output' },
];

export const LiveAnnouncerPanel: React.FC<LiveAnnouncerPanelProps> = ({
  activeModule,
  latestSeverity,
  latestAnnouncement,
  outputChannel,
  onChangeOutputChannel,
  signLanguage,
  onChangeSignLanguage,
  uiLocale = 'en',
  events,
  onClearEvents,
}) => {
  const [showUnicodeDots, setShowUnicodeDots] = useState(false);
  const [aslStepIndex, setAslStepIndex] = useState(0);
  const [hapticStatus, setHapticStatus] = useState<string | null>(null);
  const [swDirection, setSwDirection] = useState<SignWritingDirection>('vertical');

  const isPresetLanguage = SIGN_LANGUAGE_PRESETS.some(
    (p) => p.id.toLowerCase() === signLanguage.toLowerCase()
  );
  const [useCustomLanguage, setUseCustomLanguage] = useState<boolean>(!isPresetLanguage);
  const [customLanguageDraft, setCustomLanguageDraft] = useState<string>(
    isPresetLanguage ? '' : signLanguage
  );

  // Sync selector mode when signLanguage changes externally (e.g. from LanguageTestDialog)
  useEffect(() => {
    const matchesPreset = SIGN_LANGUAGE_PRESETS.some(
      (p) => p.id.toLowerCase() === signLanguage.toLowerCase()
    );
    if (matchesPreset) {
      setUseCustomLanguage(false);
    } else {
      setUseCustomLanguage(true);
      setCustomLanguageDraft(signLanguage);
    }
  }, [signLanguage]);

  const bundle = useMemo(
    () =>
      buildAccessibleEventBundle(
        activeModule,
        latestSeverity,
        latestAnnouncement,
        signLanguage,
        swDirection
      ),
    [activeModule, latestSeverity, latestAnnouncement, signLanguage, swDirection]
  );

  // Reset ASL step cursor and haptic banner when new event arrives
  useEffect(() => {
    setAslStepIndex(0);
    setHapticStatus(null);
  }, [latestAnnouncement, activeModule]);

  const activeAslStep =
    bundle.aslSteps[Math.min(aslStepIndex, Math.max(0, bundle.aslSteps.length - 1))];

  const liveAnnouncementText = useMemo(() => {
    switch (outputChannel) {
      case 'braille':
        return bundle.brailleLines.join(' ');
      case 'protactile':
        return `${bundle.protactile.spatialZone}. ${bundle.protactile.topographicTrace}. Backchannel: ${bundle.protactile.backchannel}.`;
      case 'asl':
        return `ASL Gloss: ${bundle.aslGloss}`;
      case 'signwriting':
        return `SignWriting (${bundle.signWriting.language.code}): ${bundle.signWriting.localizedGlossLine} · ${bundle.signWriting.boxes.length} SignBoxes · SWU: ${bundle.signWriting.swu}`;
      default:
        return bundle.standard;
    }
  }, [outputChannel, bundle]);

  const handleTriggerHaptic = () => {
    const pattern = bundle.protactile.hapticPatternMs;
    const supported =
      typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    if (supported) {
      navigator.vibrate(pattern);
      setHapticStatus(`Dispatched vibration [${pattern.join('ms, ')}ms]`);
    } else {
      setHapticStatus(
        `Visual tactile cadence ready: [${pattern.join('ms, ')}ms] (hardware vibrator unavailable in browser)`
      );
    }
  };

  return (
    <aside
      aria-label="Multi-Modal Accessibility Announcer, Braille, Protactile, ASL, and Audit Log"
      className="flex flex-col rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {translateUi(uiLocale, 'eventOutputTitle')}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {translateUi(uiLocale, 'eventOutputSubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClearEvents}
          disabled={events.length === 0}
          aria-label="Clear audit log entries"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{translateUi(uiLocale, 'clearLog')}</span>
        </button>
      </div>

      {/* Quick Channel Switcher */}
      <div
        role="group"
        aria-label="Inspect accessible output format"
        className="mt-3 grid grid-cols-5 gap-1 rounded-lg bg-[var(--bg-subtle)] p-1"
      >
        {CHANNEL_LABELS.map(({ id, label, ariaLabel }) => {
          const active = outputChannel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeOutputChannel(id)}
              aria-pressed={active}
              aria-label={ariaLabel}
              className={`min-h-[32px] rounded-md px-1 py-1 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text-on)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ARIA live region */}
      <div
        role={latestSeverity === 'warning' ? 'alert' : 'status'}
        aria-live={latestSeverity === 'warning' ? 'assertive' : 'polite'}
        aria-atomic="true"
        data-testid="live-announcer"
        className="mt-3 rounded-lg bg-[var(--bg-subtle)] p-3.5"
      >
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          Latest Event ({outputChannel.toUpperCase()})
        </p>
        <p className="mt-1 break-words [overflow-wrap:anywhere] text-sm font-medium leading-snug text-[var(--text-primary)]">
          {liveAnnouncementText}
        </p>
      </div>

      {/* 40-Cell Refreshable Braille Display Buffer */}
      {outputChannel === 'braille' && (
        <div
          data-testid="braille-buffer"
          className="mt-3 border-t border-[var(--border-hairline)] pt-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-[var(--text-primary)]">
              40-Cell Braille Display Buffer
            </h3>
            <button
              type="button"
              onClick={() => setShowUnicodeDots((v) => !v)}
              aria-pressed={showUnicodeDots}
              className="rounded border border-[var(--border-hairline)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {showUnicodeDots ? 'Show ASCII' : 'Show Dots'}
            </button>
          </div>
          <ol
            aria-label="40-cell Braille output lines"
            className="mt-2 space-y-1 rounded-lg bg-[var(--bg-subtle)] p-3 font-mono text-xs text-[var(--text-primary)]"
          >
            {(showUnicodeDots ? bundle.brailleDots : bundle.brailleLines).map(
              (line, idx) => (
                <li key={idx} className="break-all">
                  <span className="text-[var(--text-muted)]">{idx + 1}: </span>
                  <span>{line}</span>
                </li>
              )
            )}
          </ol>
        </div>
      )}

      {/* Protactile Language (PT) Output */}
      {outputChannel === 'protactile' && (
        <div
          data-testid="protactile-panel"
          className="mt-3 space-y-2.5 border-t border-[var(--border-hairline)] pt-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
              <Hand className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
              <span>Protactile Language (PT) Cue</span>
            </h3>
            <button
              type="button"
              onClick={handleTriggerHaptic}
              className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              <Vibrate className="h-3 w-3" aria-hidden="true" />
              <span>Pulse Haptics</span>
            </button>
          </div>

          <dl className="space-y-2 rounded-lg bg-[var(--bg-subtle)] p-3 text-xs">
            <div>
              <dt className="font-semibold text-[var(--text-muted)]">Contact Space</dt>
              <dd className="mt-0.5 text-[var(--text-primary)]">
                {bundle.protactile.contactSetup}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text-muted)]">Spatial Zone Anchor</dt>
              <dd className="mt-0.5 font-semibold text-[var(--accent-primary)]">
                {bundle.protactile.spatialZone}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text-muted)]">Topographic Trace</dt>
              <dd className="mt-0.5 text-[var(--text-primary)]">
                {bundle.protactile.topographicTrace}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-2">
              <div>
                <dt className="font-semibold text-[var(--text-muted)]">Backchannel</dt>
                <dd className="font-mono text-[11px] font-semibold text-[var(--text-primary)]">
                  {bundle.protactile.backchannel}
                </dd>
              </div>
              <div className="text-right">
                <dt className="font-semibold text-[var(--text-muted)]">Cadence</dt>
                <dd className="font-mono text-[11px] tabular-nums text-[var(--text-primary)]">
                  {bundle.protactile.hapticPatternMs.join('-')}ms
                </dd>
              </div>
            </div>
          </dl>

          {hapticStatus && (
            <p role="status" className="text-[11px] font-medium text-[var(--accent-primary)]">
              {hapticStatus}
            </p>
          )}
        </div>
      )}

      {/* American Sign Language (ASL) Output */}
      {outputChannel === 'asl' && (
        <div
          data-testid="asl-panel"
          className="mt-3 space-y-2.5 border-t border-[var(--border-hairline)] pt-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-[var(--text-primary)]">
              American Sign Language (ASL)
            </h3>
            <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
              Sign {aslStepIndex + 1}/{bundle.aslSteps.length}
            </span>
          </div>

          <div className="rounded-lg bg-[var(--bg-subtle)] p-3">
            <p className="text-[11px] font-semibold text-[var(--text-muted)]">
              Topic-Comment ASL Gloss
            </p>
            <p className="mt-1 font-mono text-xs font-semibold text-[var(--text-primary)]">
              {bundle.aslGloss}
            </p>
          </div>

          {activeAslStep && (
            <div className="rounded-lg bg-[var(--bg-subtle)] p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-[var(--accent-primary)]">
                  {activeAslStep.gloss}
                </span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  NMM: {activeAslStep.nonManualMarker}
                </span>
              </div>
              <dl className="grid grid-cols-1 gap-1 pt-1 text-[11px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Handshape:</dt>
                  <dd className="text-right font-medium text-[var(--text-primary)]">
                    {activeAslStep.handshape}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Location:</dt>
                  <dd className="text-right font-medium text-[var(--text-primary)]">
                    {activeAslStep.location}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Movement:</dt>
                  <dd className="text-right font-medium text-[var(--text-primary)]">
                    {activeAslStep.movement}
                  </dd>
                </div>
              </dl>

              {bundle.aslSteps.length > 1 && (
                <div className="flex items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-2">
                  <button
                    type="button"
                    onClick={() => setAslStepIndex((i) => Math.max(0, i - 1))}
                    disabled={aslStepIndex === 0}
                    className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[var(--border-hairline)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3 w-3" aria-hidden="true" />
                    <span>Prev Sign</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAslStepIndex((i) =>
                        Math.min(bundle.aslSteps.length - 1, i + 1)
                      )
                    }
                    disabled={aslStepIndex >= bundle.aslSteps.length - 1}
                    className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[var(--border-hairline)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>Next Sign</span>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sutton SignWriting Output in Any International Sign Language */}
      {outputChannel === 'signwriting' && (
        <div
          data-testid="signwriting-panel"
          className="mt-3 space-y-2.5 border-t border-[var(--border-hairline)] pt-3"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="sw-language-select"
              className="block text-xs font-semibold text-[var(--text-primary)]"
            >
              SignWriting Target Sign Language
            </label>
            <select
              id="sw-language-select"
              value={useCustomLanguage ? '__custom__' : bundle.signWriting.language.id}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__custom__') {
                  setUseCustomLanguage(true);
                  if (customLanguageDraft.trim()) {
                    onChangeSignLanguage(customLanguageDraft.trim());
                  }
                } else {
                  setUseCustomLanguage(false);
                  onChangeSignLanguage(val);
                }
              }}
              className="min-h-[36px] w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)]"
            >
              {SIGN_LANGUAGE_PRESETS.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.code} · {lang.nativeName}
                </option>
              ))}
              <option value="__custom__">
                Custom Sign Language (Any ISO 639-3 / Name)...
              </option>
            </select>

            {useCustomLanguage && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const next = customLanguageDraft.trim();
                  if (next) onChangeSignLanguage(next);
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  aria-label="Enter any international sign language name or ISO code"
                  placeholder="e.g. KSL, FSL, CSL, NZSL..."
                  value={customLanguageDraft}
                  onChange={(e) => setCustomLanguageDraft(e.target.value)}
                  className="min-h-[34px] flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                />
                <button
                  type="submit"
                  className="min-h-[34px] rounded-lg bg-[var(--accent-primary)] px-3 py-1 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          <SignWritingLane
            sequence={bundle.signWriting}
            direction={swDirection}
            onToggleDirection={() =>
              setSwDirection((d) => (d === 'vertical' ? 'horizontal' : 'vertical'))
            }
          />
        </div>
      )}

      {/* Chronological event feed */}
      <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>{translateUi(uiLocale, 'operationLog')}</span>
          <span className="font-mono tabular-nums">{events.length} events</span>
        </div>

        {events.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-hairline)] p-4 text-center text-xs text-[var(--text-muted)]">
            No operations logged yet. Perform an action in any module to record an entry.
          </p>
        ) : (
          <ul
            aria-label="Chronological cluster operations"
            className="max-h-[300px] space-y-2 overflow-y-auto pr-1"
          >
            {events.map((ev) => {
              const Icon =
                ev.severity === 'success'
                  ? CheckCircle2
                  : ev.severity === 'warning'
                    ? AlertTriangle
                    : Info;
              const statusText =
                ev.severity === 'success'
                  ? 'Confirmed'
                  : ev.severity === 'warning'
                    ? 'Attention'
                    : 'Info';
              const toneClass =
                ev.severity === 'success'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : ev.severity === 'warning'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-[var(--accent-primary)]';

              return (
                <li
                  key={ev.id}
                  className="border-b border-[var(--border-hairline)] pb-2.5 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                    <span className={`inline-flex items-center gap-1 font-medium ${toneClass}`}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{statusText}</span>
                      <span aria-hidden="true">·</span>
                      <span>{MODULE_LABELS[ev.module]}</span>
                    </span>
                    <time className="font-mono tabular-nums">{ev.timestamp}</time>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-primary)]">
                    {ev.summary}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};
