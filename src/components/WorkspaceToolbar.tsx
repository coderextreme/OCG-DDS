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
  UI_LOCALES,
  type SupportedUiLocale,
  type UiMessageKey,
} from '../core/i18n';
import type { AccessibleOutputChannel, ThemeMode } from '../types/system';
import { ACCESSIBILITY_LANGUAGE_OPTIONS, accessibilityProfileLabels } from '../core/accessibilityLanguages';

interface WorkspaceToolbarProps {
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  outputChannel: AccessibleOutputChannel;
  onChangeOutputChannel: (channel: AccessibleOutputChannel) => void;
  uiLocale: SupportedUiLocale;
  onChangeUiLocale: (locale: SupportedUiLocale) => void;
  accessibilityProfile: string;
  onChangeAccessibilityProfile: (profileId: string) => void;
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
  onChangeOutputChannel,
  uiLocale,
  onChangeUiLocale,
  accessibilityProfile,
  onChangeAccessibilityProfile,
  onOpenLanguageLab,
  onResetCluster,
}) => {
  const accessibilityLabels = accessibilityProfileLabels(uiLocale);
  return (
    <div className="border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Display Contrast Selector + Language Quick Selector */}
        <div className="flex flex-wrap items-center gap-3">
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

          <div className="flex flex-wrap items-center gap-1.5">
            <label
              htmlFor="toolbar-ui-locale"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)]"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{translateUi(uiLocale, 'languageLabel')}</span>
            </label>
            <select
              id="toolbar-ui-locale"
              aria-label={translateUi(uiLocale, 'interfaceLanguageAria')}
              value={uiLocale}
              onChange={(e) =>
                onChangeUiLocale(e.target.value as SupportedUiLocale)
              }
              className="min-h-[38px] max-w-[175px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              {UI_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.nativeName} ({loc.code})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onOpenLanguageLab}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--bg-canvas)] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{translateUi(uiLocale, 'testLanguages')}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <label
              htmlFor="accessibility-language-profile"
              className="text-xs font-medium text-[var(--text-muted)]"
            >
              {accessibilityLabels.label}
            </label>
            <select
              id="accessibility-language-profile"
              aria-describedby="accessibility-language-profile-help"
              value={accessibilityProfile}
              onChange={(e) => onChangeAccessibilityProfile(e.target.value)}
              className="min-h-[38px] max-w-[260px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)]"
            >
              <optgroup label={accessibilityLabels.brailleGroup}>
                {ACCESSIBILITY_LANGUAGE_OPTIONS.filter((option) => option.kind === 'braille').map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.code} · {option.nativeName}
                  </option>
                ))}
              </optgroup>
              <optgroup label={accessibilityLabels.deafblindGroup}>
                {ACCESSIBILITY_LANGUAGE_OPTIONS.filter((option) => option.kind === 'deafblind').map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.code} · {option.nativeName}
                  </option>
                ))}
              </optgroup>
            </select>
            <span id="accessibility-language-profile-help" className="sr-only">
              Choose a preferred braille code or deafblind communication approach. This currently selects a profile and output channel; it does not provide automatic translation or interpretation.
            </span>
            <span className="sr-only" aria-live="polite">
              Profile selection is saved on this device.
            </span>
          </div>
        </div>

        {/* Accessible Output Channel Selector + Motion + Reset */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)]"
              id="output-channel-label"
            >
              {outputChannel === 'protactile' ? (
                <Hand className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Accessibility className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{translateUi(uiLocale, 'outputChannel')}</span>
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
