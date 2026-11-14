import React from 'react';
import {
  Accessibility,
  Contrast,
  Hand,
  Moon,
  RotateCcw,
  Sun,
  VolumeX,
} from 'lucide-react';
import type { AccessibleOutputChannel, ThemeMode } from '../types/system';

interface WorkspaceToolbarProps {
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  outputChannel: AccessibleOutputChannel;
  onChangeOutputChannel: (channel: AccessibleOutputChannel) => void;
  onResetCluster: () => void;
}

const THEME_OPTIONS: Array<{
  id: ThemeMode;
  label: string;
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}> = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'high-contrast', label: 'High Contrast', Icon: Contrast },
];

const OUTPUT_OPTIONS: Array<{
  id: AccessibleOutputChannel;
  label: string;
}> = [
  { id: 'standard', label: 'Standard' },
  { id: 'braille', label: 'Braille' },
  { id: 'protactile', label: 'Protactile' },
  { id: 'asl', label: 'ASL' },
  { id: 'signwriting', label: 'SignWriting' },
];

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  theme,
  onChangeTheme,
  reducedMotion,
  onToggleReducedMotion,
  outputChannel,
  onChangeOutputChannel,
  onResetCluster,
}) => {
  return (
    <div className="border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Display Contrast Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="text-xs font-medium text-[var(--text-muted)]"
            id="theme-group-label"
          >
            Display Contrast
          </span>
          <div
            role="group"
            aria-labelledby="theme-group-label"
            className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5"
          >
            {THEME_OPTIONS.map(({ id, label, Icon }) => {
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
                  <span>{label}</span>
                </button>
              );
            })}
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
              <span>Output Channel</span>
            </span>
            <div
              role="group"
              aria-labelledby="output-channel-label"
              className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5"
            >
              {OUTPUT_OPTIONS.map(({ id, label }) => {
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
                    {label}
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
            <span>{reducedMotion ? 'Motion: Reduced' : 'Motion: Standard'}</span>
          </button>

          <button
            type="button"
            onClick={onResetCluster}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Cluster</span>
          </button>
        </div>
      </div>
    </div>
  );
};
