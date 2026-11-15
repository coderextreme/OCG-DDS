import React, { useEffect, useState } from 'react';
import {
  BRAILLE_LANGUAGE_OPTIONS,
  DEAFBLIND_COMMUNICATION_OPTIONS,
  accessibilityProfileLabels,
} from '../core/accessibilityLanguages';
import type { AccessibleOutputChannel } from '../core/accessibilityOutput';
import {
  translateUi,
  UI_LOCALES,
  type SupportedUiLocale,
} from '../core/i18n';
import { resolveSignLanguage, SIGN_LANGUAGE_PRESETS } from '../core/signWriting';

interface UnifiedLanguageOutputSelectProps {
  id: string;
  uiLocale: SupportedUiLocale;
  outputChannel: AccessibleOutputChannel;
  brailleProfileId: string;
  deafblindProfileId: string;
  signLanguage: string;
  onSelectVariant: (variantKey: string) => void;
  onApplyCustomSignLanguage: (
    channel: 'asl' | 'signwriting',
    customCodeOrName: string
  ) => void;
  ariaDescribedBy?: string;
  className?: string;
  showInlineCustomForm?: boolean;
}

export const UnifiedLanguageOutputSelect: React.FC<
  UnifiedLanguageOutputSelectProps
> = ({
  id,
  uiLocale,
  outputChannel,
  brailleProfileId,
  deafblindProfileId,
  signLanguage,
  onSelectVariant,
  onApplyCustomSignLanguage,
  ariaDescribedBy,
  className = '',
  showInlineCustomForm = true,
}) => {
  const accessibilityLabels = accessibilityProfileLabels(uiLocale);
  const resolvedSign = resolveSignLanguage(signLanguage);
  const signIdForKey = resolvedSign.isCustom ? signLanguage : resolvedSign.id;

  const [customDraft, setCustomDraft] = useState<string>(
    resolvedSign.isCustom ? signLanguage : ''
  );
  const [customPromptChannel, setCustomPromptChannel] = useState<
    'asl' | 'signwriting' | null
  >(null);

  useEffect(() => {
    if (resolvedSign.isCustom) {
      setCustomDraft(signLanguage);
    } else {
      setCustomPromptChannel(null);
    }
  }, [signLanguage, resolvedSign.isCustom]);

  const activeVariantKey =
    outputChannel === 'braille'
      ? `braille:${brailleProfileId}`
      : outputChannel === 'protactile'
        ? `protactile:${deafblindProfileId}`
        : outputChannel === 'asl'
          ? `asl:${signIdForKey}`
          : outputChannel === 'signwriting'
            ? `signwriting:${signIdForKey}`
            : `standard:${uiLocale}`;

  const customChannelTarget: 'asl' | 'signwriting' =
    customPromptChannel ??
    (outputChannel === 'asl' ? 'asl' : 'signwriting');

  const isCustomInputVisible =
    showInlineCustomForm &&
    (customPromptChannel !== null ||
      (resolvedSign.isCustom &&
        (outputChannel === 'asl' || outputChannel === 'signwriting')));

  return (
    <div className="flex flex-col gap-1.5">
      <select
        id={id}
        aria-label={`${translateUi(uiLocale, 'outputChannel')} / ${translateUi(uiLocale, 'languageLabel')}`}
        aria-describedby={ariaDescribedBy}
        value={activeVariantKey}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'asl:__custom__') {
            setCustomPromptChannel('asl');
            onSelectVariant(`asl:${signIdForKey}`);
            return;
          }
          if (val === 'signwriting:__custom__') {
            setCustomPromptChannel('signwriting');
            onSelectVariant(`signwriting:${signIdForKey}`);
            return;
          }
          setCustomPromptChannel(null);
          onSelectVariant(val);
        }}
        className={
          className ||
          'min-h-[38px] w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer'
        }
      >
        <optgroup
          label={`${translateUi(uiLocale, 'channelStandard')} · ${translateUi(uiLocale, 'languageLabel')}`}
        >
          {UI_LOCALES.map((loc) => (
            <option key={`standard:${loc.code}`} value={`standard:${loc.code}`}>
              {translateUi(uiLocale, 'channelStandard')} · {loc.nativeName} ({loc.code}
              {loc.dir === 'rtl' ? ', RTL' : ''})
            </option>
          ))}
        </optgroup>

        <optgroup label={accessibilityLabels.brailleGroup}>
          {BRAILLE_LANGUAGE_OPTIONS.map((option) => (
            <option key={`braille:${option.id}`} value={`braille:${option.id}`}>
              {translateUi(uiLocale, 'channelBraille')} · {option.code} ·{' '}
              {option.nativeName}
            </option>
          ))}
        </optgroup>

        <optgroup label={accessibilityLabels.deafblindGroup}>
          {DEAFBLIND_COMMUNICATION_OPTIONS.map((option) => (
            <option
              key={`protactile:${option.id}`}
              value={`protactile:${option.id}`}
            >
              {translateUi(uiLocale, 'channelProtactile')} · {option.nativeName}
            </option>
          ))}
        </optgroup>

        <optgroup label={translateUi(uiLocale, 'channelAsl')}>
          {SIGN_LANGUAGE_PRESETS.map((lang) => (
            <option key={`asl:${lang.id}`} value={`asl:${lang.id}`}>
              {translateUi(uiLocale, 'channelAsl')} · {lang.code} · {lang.nativeName}
            </option>
          ))}
          {resolvedSign.isCustom && (
            <option value={`asl:${signLanguage}`}>
              {translateUi(uiLocale, 'channelAsl')} · {resolvedSign.code} ·{' '}
              {resolvedSign.name}
            </option>
          )}
          <option value="asl:__custom__">
            {translateUi(uiLocale, 'channelAsl')} · {translateUi(uiLocale, 'swCustomOption')}
          </option>
        </optgroup>

        <optgroup label={translateUi(uiLocale, 'channelSignWriting')}>
          {SIGN_LANGUAGE_PRESETS.map((lang) => (
            <option
              key={`signwriting:${lang.id}`}
              value={`signwriting:${lang.id}`}
            >
              {translateUi(uiLocale, 'channelSignWriting')} · {lang.code} ·{' '}
              {lang.nativeName}
            </option>
          ))}
          {resolvedSign.isCustom && (
            <option value={`signwriting:${signLanguage}`}>
              {translateUi(uiLocale, 'channelSignWriting')} · {resolvedSign.code} ·{' '}
              {resolvedSign.name}
            </option>
          )}
          <option value="signwriting:__custom__">
            {translateUi(uiLocale, 'channelSignWriting')} · {translateUi(uiLocale, 'swCustomOption')}
          </option>
        </optgroup>
      </select>

      {isCustomInputVisible && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = customDraft.trim();
            if (next) {
              onApplyCustomSignLanguage(customChannelTarget, next);
              setCustomPromptChannel(null);
            }
          }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            aria-label={translateUi(uiLocale, 'swCustomInputAria')}
            placeholder={translateUi(uiLocale, 'swCustomPlaceholder')}
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            className="min-h-[34px] flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
          />
          <button
            type="submit"
            className="min-h-[34px] rounded-lg bg-[var(--accent-primary)] px-3 py-1 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
          >
            {translateUi(uiLocale, 'applyBtn')}
          </button>
        </form>
      )}
    </div>
  );
};
