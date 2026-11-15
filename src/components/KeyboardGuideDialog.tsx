import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import {
  translateUi,
  type SupportedUiLocale,
  type UiMessageKey,
} from '../core/i18n';

interface KeyboardGuideDialogProps {
  open: boolean;
  uiLocale?: SupportedUiLocale;
  onClose: () => void;
}

const SHORTCUT_ROWS: Array<{
  keys: string;
  scopeKey: UiMessageKey;
  actKey: UiMessageKey;
}> = [
  { keys: 'Tab / Shift + Tab', scopeKey: 'kbScopeGlobal', actKey: 'kbActTab' },
  { keys: 'ArrowLeft / ArrowRight', scopeKey: 'kbScopeNav', actKey: 'kbActArrows' },
  { keys: 'Home / End', scopeKey: 'kbScopeNav', actKey: 'kbActHomeEnd' },
  { keys: 'Alt + 1..4', scopeKey: 'kbScopeGlobal', actKey: 'kbActAltNums' },
  { keys: 'Alt + E', scopeKey: 'kbScopeGlobal', actKey: 'kbActAltE' },
  { keys: 'F D S / J K L', scopeKey: 'kbScopeBraille', actKey: 'kbActPerkins' },
  { keys: 'ASL / PT Builder', scopeKey: 'kbScopeConsole', actKey: 'kbActAslPt' },
  { keys: 'Edit & - / + Steppers', scopeKey: 'kbScopeTables', actKey: 'kbActSteppers' },
  { keys: 'Output Channel', scopeKey: 'kbScopeToolbar', actKey: 'kbActChannels' },
  { keys: '?', scopeKey: 'kbScopeGlobal', actKey: 'kbActHelp' },
  { keys: 'Escape', scopeKey: 'kbScopeDialog', actKey: 'kbActEscape' },
];

export const KeyboardGuideDialog: React.FC<KeyboardGuideDialogProps> = ({
  open,
  uiLocale = 'en',
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
        aria-labelledby="keyboard-guide-title"
        className="w-full max-w-2xl rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div>
            <h2 id="keyboard-guide-title" className="text-lg font-bold text-[var(--text-primary)]">
              {translateUi(uiLocale, 'kbGuideTitle')}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {translateUi(uiLocale, 'kbGuideSubtitle')}
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

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-muted)]">
                <th scope="col" className="py-2 pr-4">{translateUi(uiLocale, 'kbShortcutCol')}</th>
                <th scope="col" className="py-2 pr-4">{translateUi(uiLocale, 'kbContextCol')}</th>
                <th scope="col" className="py-2">{translateUi(uiLocale, 'kbBehaviorCol')}</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUT_ROWS.map((row) => (
                <tr key={row.keys} className="border-b border-[var(--border-hairline)] last:border-b-0">
                  <td className="py-2.5 pr-4 font-mono text-xs font-semibold whitespace-nowrap text-[var(--accent-primary)]">
                    {row.keys}
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                    {translateUi(uiLocale, row.scopeKey)}
                  </td>
                  <td className="py-2.5 text-sm text-[var(--text-secondary)]">
                    {translateUi(uiLocale, row.actKey)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
