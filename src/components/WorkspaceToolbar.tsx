import React from 'react';
import {
  Accessibility,
  Contrast,
  Globe,
  Hand,
  Moon,
  RotateCcw,
  Sun,
  VolumeX,
} from 'lucide-react';
import {
  translateUi,
  type SupportedUiLocale,
  type UiMessageKey,
} from '../core/i18n';
import type { AccessibleOutputChannel, ThemeMode } from '../types/system';
import { UnifiedLanguageOutputSelect } from './UnifiedLanguageOutputSelect';

interface WorkspaceToolbarProps {
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  outputChannel: AccessibleOutputChannel;
  brailleProfileId: string;
  deafblindProfileId: string;
  signLanguage: string;
  onChangeOutputChannel: (channel: AccessibleOutputChannel) => void;
  onSelectOutputVariant: (variantKey: string) => void;
  uiLocale: SupportedUiLocale;
  onOpenLanguageLab: () => void;
  onResetCluster: () => void;
}

const THEME_OPTIONS: Array<{
  id: ThemeMode;
  key: UiMessageKey;
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}> = [
  { id: 'light', key: 'themeLight', Icon: Sun },
  { id: 'dark', key: 'themeDark', Icon: Moon },
  { id: 'high-contrast', key: 'themeHighContrast', Icon: Contrast },
];

const OUTPUT_OPTIONS: Array<{
  id: AccessibleOutputChannel;
  key: UiMessageKey;
}> = [
  { id: 'standard', key: 'channelStandard' },
  { id: 'braille', key: 'channelBraille' },
  { id: 'protactile', key: 'channelProtactile' },
  { id: 'asl', key: 'channelAsl' },
  { id: 'signwriting', key: 'channelSignWriting' },
];

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  theme,
  onChangeTheme,
  reducedMotion,
  onToggleReducedMotion,
  outputChannel,
  brailleProfileId,
  deafblindProfileId,
  signLanguage,
  onChangeOutputChannel,
  onSelectOutputVariant,
  uiLocale,
  onOpenLanguageLab,
  onResetCluster,
}) => {
  return (
    <div className="border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Display Contrast Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-medium text-[var(--text-muted)]"
            id="theme-group-label"
          >
            {translateUi(uiLocale, 'displayContrast')}
          </span>
          <div
            role="group"
            aria-labelledby="theme-group-label"
            className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5"
          >
            {THEME_OPTIONS.map(({ id, key, Icon }) => {
              const selected = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChangeTheme(id)}
                  aria-pressed={selected}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                    selected
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-text-on)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden={true} />
                  <span>{translateUi(uiLocale, key)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Combined Language (Standard), Output Channel, and Accessible Event Language Selector + Motion + Reset */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)]"
              id="output-channel-label"
            >
              {outputChannel === 'protactile' ? (
                <Hand className="h-3.5 w-3.5" aria-hidden="true" />
              ) : outputChannel === 'standard' ? (
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Accessibility className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {translateUi(uiLocale, 'outputChannel')} · {translateUi(uiLocale, 'languageLabel')}
              </span>
            </span>

            <div
              role="group"
              aria-labelledby="output-channel-label"
              className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5"
            >
              {OUTPUT_OPTIONS.map(({ id, key }) => {
                const selected = outputChannel === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangeOutputChannel(id)}
                    aria-pressed={selected}
                    className={`inline-flex min-h-[36px] items-center rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      selected
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-text-on)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {translateUi(uiLocale, key)}
                  </button>
                );
              })}
            </div>

            <div className="w-full sm:w-auto sm:min-w-[230px] sm:max-w-[270px]">
              <UnifiedLanguageOutputSelect
                id="output-channel-variant"
                uiLocale={uiLocale}
                outputChannel={outputChannel}
                brailleProfileId={brailleProfileId}
                deafblindProfileId={deafblindProfileId}
                signLanguage={signLanguage}
                onSelectVariant={onSelectOutputVariant}
                onApplyCustomSignLanguage={(channel, codeOrName) =>
                  onSelectOutputVariant(`${channel}:${codeOrName}`)
                }
                ariaDescribedBy="output-variant-help"
              />
              <span id="output-variant-help" className="sr-only">
                Unified selector combining Standard UI languages, Braille display codes, DeafBlind tactile communication methods, natural Sign Languages, and SignWriting 2D languages. Braille codes and DeafBlind methods configure display and cue framing preferences and do not claim automatic human translation.
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenLanguageLab}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--bg-canvas)] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{translateUi(uiLocale, 'testLanguages')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleReducedMotion}
            aria-pressed={reducedMotion}
            className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              reducedMotion
                ? 'border-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--accent-primary)] font-semibold'
                : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {reducedMotion
                ? translateUi(uiLocale, 'motionReduced')
                : translateUi(uiLocale, 'motionStandard')}
            </span>
          </button>

          <button
            type="button"
            onClick={onResetCluster}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{translateUi(uiLocale, 'resetCluster')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
