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
import {
  formatLocalizedTime,
  formatUi,
  resolveUiLocale,
  translateUi,
  type SupportedUiLocale,
  type UiMessageKey,
} from '../core/i18n';
import type { SignWritingDirection } from '../core/signWriting';
import type { AuditEvent, SystemModuleId } from '../types/system';
import { SignWritingLane } from './SignWritingLane';
import { UnifiedLanguageOutputSelect } from './UnifiedLanguageOutputSelect';

interface LiveAnnouncerPanelProps {
  activeModule: SystemModuleId;
  latestSeverity: 'info' | 'warning' | 'success';
  latestAnnouncement: string;
  outputChannel: AccessibleOutputChannel;
  onChangeOutputChannel: (channel: AccessibleOutputChannel) => void;
  brailleProfileId: string;
  deafblindProfileId: string;
  signLanguage: string;
  onSelectOutputVariant: (variantKey: string) => void;
  uiLocale?: SupportedUiLocale;
  events: AuditEvent[];
  onClearEvents: () => void;
}

const MODULE_KEYS: Record<SystemModuleId, UiMessageKey> = {
  graph: 'navGraph',
  sync: 'navSync',
  sharding: 'navSharding',
  capabilities: 'navCapabilities',
};

const CHANNEL_OPTIONS: Array<{
  id: AccessibleOutputChannel;
  key: UiMessageKey;
}> = [
  { id: 'standard', key: 'pillStd' },
  { id: 'braille', key: 'pillBraille' },
  { id: 'protactile', key: 'pillPt' },
  { id: 'asl', key: 'pillAsl' },
  { id: 'signwriting', key: 'pillSignW' },
];

export const LiveAnnouncerPanel: React.FC<LiveAnnouncerPanelProps> = ({
  activeModule,
  latestSeverity,
  latestAnnouncement,
  outputChannel,
  onChangeOutputChannel,
  brailleProfileId,
  deafblindProfileId,
  signLanguage,
  onSelectOutputVariant,
  uiLocale = 'en',
  events,
  onClearEvents,
}) => {
  const [showUnicodeDots, setShowUnicodeDots] = useState(false);
  const [aslStepIndex, setAslStepIndex] = useState(0);
  const [hapticStatus, setHapticStatus] = useState<string | null>(null);
  const [swDirection, setSwDirection] = useState<SignWritingDirection>('vertical');

  const activeLocaleSpec = resolveUiLocale(uiLocale);

  const bundle = useMemo(
    () =>
      buildAccessibleEventBundle(
        activeModule,
        latestSeverity,
        latestAnnouncement,
        signLanguage,
        swDirection,
        uiLocale,
        brailleProfileId,
        deafblindProfileId
      ),
    [
      activeModule,
      latestSeverity,
      latestAnnouncement,
      signLanguage,
      swDirection,
      uiLocale,
      brailleProfileId,
      deafblindProfileId,
    ]
  );

  // Reset sign step cursor and haptic banner when new event arrives or output variant changes
  useEffect(() => {
    setAslStepIndex(0);
    setHapticStatus(null);
  }, [latestAnnouncement, activeModule, signLanguage, deafblindProfileId, brailleProfileId]);

  const activeAslStep =
    bundle.aslSteps[Math.min(aslStepIndex, Math.max(0, bundle.aslSteps.length - 1))];

  const activeChannelBadge = useMemo(() => {
    switch (outputChannel) {
      case 'braille':
        return `${translateUi(uiLocale, 'channelBraille')} · ${bundle.brailleProfile.code}`;
      case 'protactile':
        return `${translateUi(uiLocale, 'channelProtactile')} · ${bundle.protactile.profileCode}`;
      case 'asl':
        return `${translateUi(uiLocale, 'channelAsl')} · ${bundle.signLanguageSpec.code}`;
      case 'signwriting':
        return `${translateUi(uiLocale, 'channelSignWriting')} · ${bundle.signWriting.language.code}`;
      default:
        return `${translateUi(uiLocale, 'channelStandard')} · ${activeLocaleSpec.nativeName} (${activeLocaleSpec.code})`;
    }
  }, [outputChannel, uiLocale, bundle, activeLocaleSpec]);

  const liveAnnouncementText = useMemo(() => {
    switch (outputChannel) {
      case 'braille':
        return `${bundle.brailleProfile.nativeName}: ${bundle.brailleLines.join(' ')}`;
      case 'protactile':
        return `${bundle.protactile.profileName} · ${bundle.protactile.spatialZone}. ${bundle.protactile.topographicTrace}. Backchannel: ${bundle.protactile.backchannel}.`;
      case 'asl':
        return `${bundle.signLanguageSpec.code} (${bundle.signLanguageSpec.nativeName}): ${bundle.aslGloss}`;
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
      setHapticStatus(
        formatUi(uiLocale, 'hapticDispatched', { pattern: pattern.join('ms, ') })
      );
    } else {
      setHapticStatus(
        formatUi(uiLocale, 'hapticVisualReady', { pattern: pattern.join('ms, ') })
      );
    }
  };

  const manualTypeStr =
    bundle.signLanguageSpec.alphabetType === 'two-handed'
      ? translateUi(uiLocale, 'manual2H')
      : translateUi(uiLocale, 'manual1H');

  return (
    <aside
      aria-label={translateUi(uiLocale, 'announcerAsideAria')}
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
          aria-label={translateUi(uiLocale, 'clearLogAria')}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{translateUi(uiLocale, 'clearLog')}</span>
        </button>
      </div>

      {/* Quick Channel Switcher */}
      <div
        role="group"
        aria-label={translateUi(uiLocale, 'inspectOutputAria')}
        className="mt-3 grid grid-cols-5 gap-1 rounded-lg bg-[var(--bg-subtle)] p-1"
      >
        {CHANNEL_OPTIONS.map(({ id, key }) => {
          const active = outputChannel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeOutputChannel(id)}
              aria-pressed={active}
              aria-label={translateUi(uiLocale, key)}
              className={`min-h-[32px] rounded-md px-1 py-1 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text-on)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {translateUi(uiLocale, key)}
            </button>
          );
        })}
      </div>

      {/* Combined Language & Output Variant Selector synced across Toolbar & Accessible Event Output */}
      <div className="mt-2.5 space-y-1">
        <label
          htmlFor="announcer-language-output-select"
          className="block text-[11px] font-semibold text-[var(--text-muted)]"
        >
          {translateUi(uiLocale, 'outputVariantLabel')}
        </label>
        <UnifiedLanguageOutputSelect
          id="announcer-language-output-select"
          uiLocale={uiLocale}
          outputChannel={outputChannel}
          brailleProfileId={brailleProfileId}
          deafblindProfileId={deafblindProfileId}
          signLanguage={signLanguage}
          onSelectVariant={onSelectOutputVariant}
          onApplyCustomSignLanguage={(channel, codeOrName) =>
            onSelectOutputVariant(`${channel}:${codeOrName}`)
          }
          className="min-h-[36px] w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer"
        />
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
          {formatUi(uiLocale, 'latestEventLabel', { channel: activeChannelBadge })}
        </p>
        <p className="mt-1 break-words [overflow-wrap:anywhere] text-sm font-medium leading-snug text-[var(--text-primary)]">
          {liveAnnouncementText}
        </p>
      </div>

      {/* 40-Cell Refreshable Braille Display Buffer */}
      {outputChannel === 'braille' && (
        <div
          data-testid="braille-buffer"
          className="mt-3 space-y-2.5 border-t border-[var(--border-hairline)] pt-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                {translateUi(uiLocale, 'brailleBufferTitle')} ({bundle.brailleProfile.code})
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {bundle.brailleProfile.nativeName} · {bundle.brailleProfile.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUnicodeDots((v) => !v)}
              aria-pressed={showUnicodeDots}
              className="shrink-0 rounded border border-[var(--border-hairline)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {showUnicodeDots ? translateUi(uiLocale, 'showAscii') : translateUi(uiLocale, 'showDots')}
            </button>
          </div>
          <ol
            aria-label={translateUi(uiLocale, 'brailleLinesAria')}
            className="space-y-1 rounded-lg bg-[var(--bg-subtle)] p-3 font-mono text-xs text-[var(--text-primary)]"
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

      {/* DeafBlind & Tactile Communication Panel */}
      {outputChannel === 'protactile' && (
        <div
          data-testid="protactile-panel"
          className="mt-3 space-y-2.5 border-t border-[var(--border-hairline)] pt-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                <Hand className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
                <span>
                  {translateUi(uiLocale, 'ptCueTitle')} · {bundle.protactile.profileName}
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {bundle.protactile.profileDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={handleTriggerHaptic}
              className="inline-flex min-h-[28px] shrink-0 items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              <Vibrate className="h-3 w-3" aria-hidden="true" />
              <span>{translateUi(uiLocale, 'pulseHaptics')}</span>
            </button>
          </div>

          <dl className="space-y-2 rounded-lg bg-[var(--bg-subtle)] p-3 text-xs">
            <div>
              <dt className="font-semibold text-[var(--text-muted)]">{translateUi(uiLocale, 'ptContactSpace')}</dt>
              <dd className="mt-0.5 text-[var(--text-primary)]">
                {bundle.protactile.contactSetup}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text-muted)]">{translateUi(uiLocale, 'ptSpatialZoneAnchor')}</dt>
              <dd className="mt-0.5 font-semibold text-[var(--accent-primary)]">
                {bundle.protactile.spatialZone}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text-muted)]">{translateUi(uiLocale, 'ptTopographicTrace')}</dt>
              <dd className="mt-0.5 text-[var(--text-primary)]">
                {bundle.protactile.topographicTrace}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-2">
              <div>
                <dt className="font-semibold text-[var(--text-muted)]">{translateUi(uiLocale, 'ptBackchannel')}</dt>
                <dd className="font-mono text-[11px] font-semibold text-[var(--text-primary)]">
                  {bundle.protactile.backchannel}
                </dd>
              </div>
              <div className="text-right">
                <dt className="font-semibold text-[var(--text-muted)]">{translateUi(uiLocale, 'ptCadence')}</dt>
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

      {/* International Natural Sign Language Gloss & Parameter Panel */}
      {outputChannel === 'asl' && (
        <div
          data-testid="asl-panel"
          className="mt-3 space-y-2.5 border-t border-[var(--border-hairline)] pt-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                {translateUi(uiLocale, 'aslTitle')} · {bundle.signLanguageSpec.code}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {bundle.signLanguageSpec.nativeName} · {bundle.signLanguageSpec.syntaxOrder.toUpperCase()} · {manualTypeStr}
              </p>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
              {formatUi(uiLocale, 'signCounter', {
                current: aslStepIndex + 1,
                total: bundle.aslSteps.length,
              })}
            </span>
          </div>

          <div className="rounded-lg bg-[var(--bg-subtle)] p-3">
            <p className="text-[11px] font-semibold text-[var(--text-muted)]">
              {translateUi(uiLocale, 'aslTopicCommentGloss')}
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
                  <dt className="text-[var(--text-muted)]">{translateUi(uiLocale, 'handshapeLabel')}</dt>
                  <dd className="text-right font-medium text-[var(--text-primary)]">
                    {activeAslStep.handshape}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">{translateUi(uiLocale, 'locationLabel')}</dt>
                  <dd className="text-right font-medium text-[var(--text-primary)]">
                    {activeAslStep.location}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">{translateUi(uiLocale, 'movementLabel')}</dt>
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
                    <span>{translateUi(uiLocale, 'prevSign')}</span>
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
                    <span>{translateUi(uiLocale, 'nextSign')}</span>
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
          <SignWritingLane
            sequence={bundle.signWriting}
            direction={swDirection}
            uiLocale={uiLocale}
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
          <span className="font-mono tabular-nums">
            {formatUi(uiLocale, 'eventsCount', { count: events.length })}
          </span>
        </div>

        {events.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-hairline)] p-4 text-center text-xs text-[var(--text-muted)]">
            {translateUi(uiLocale, 'noOperationsLogged')}
          </p>
        ) : (
          <ul
            aria-label={translateUi(uiLocale, 'chronologicalOpsAria')}
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
                  ? translateUi(uiLocale, 'statusConfirmed')
                  : ev.severity === 'warning'
                    ? translateUi(uiLocale, 'statusAttention')
                    : translateUi(uiLocale, 'statusInfo');
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
                      <span>{translateUi(uiLocale, MODULE_KEYS[ev.module])}</span>
                    </span>
                    <time className="font-mono tabular-nums">
                      {formatLocalizedTime(uiLocale, ev.timestampMs ?? Date.now())}
                    </time>
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
