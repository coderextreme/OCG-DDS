import React from 'react';
import { Keyboard } from 'lucide-react';
import {
  translateUi,
  type SupportedUiLocale,
  type UiMessageKey,
} from '../core/i18n';
import type { SystemModuleId } from '../types/system';

interface TopBarProps {
  activeModule: SystemModuleId;
  uiLocale: SupportedUiLocale;
  onSelectModule: (module: SystemModuleId) => void;
  onOpenKeyboardGuide: () => void;
}

const NAV_ITEMS: Array<{ id: SystemModuleId; key: UiMessageKey }> = [
  { id: 'graph', key: 'navGraph' },
  { id: 'sync', key: 'navSync' },
  { id: 'sharding', key: 'navSharding' },
  { id: 'capabilities', key: 'navCapabilities' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeModule,
  uiLocale,
  onSelectModule,
  onOpenKeyboardGuide,
}) => {
  return (
    <header
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]"
      role="banner"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 md:flex-nowrap md:py-3 lg:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#main-content"
          className="order-1 text-xl font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0 no-underline"
        >
          Lattice
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Distributed graph and capability modules"
          className="order-3 flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[var(--border-hairline)] pt-2 md:order-2 md:w-auto md:flex-nowrap md:justify-center md:gap-7 md:border-t-0 md:pt-0"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative min-h-[36px] md:min-h-[40px] px-1 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-[var(--accent-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {translateUi(uiLocale, item.key)}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--accent-primary)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="order-2 flex items-center shrink-0 md:order-3">
          <button
            type="button"
            onClick={onOpenKeyboardGuide}
            className="inline-flex min-h-[38px] md:min-h-[40px] items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            <span>{translateUi(uiLocale, 'keyboardGuide')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
