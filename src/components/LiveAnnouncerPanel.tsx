import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2 } from 'lucide-react';
import {
  chunkForBrailleCells,
  formatBrailleAnnouncement,
  toUnicodeBraille,
} from '../core/braille';
import type { AuditEvent, SystemModuleId } from '../types/system';

interface LiveAnnouncerPanelProps {
  activeModule: SystemModuleId;
  latestSeverity: 'info' | 'warning' | 'success';
  latestAnnouncement: string;
  brailleMode: boolean;
  events: AuditEvent[];
  onClearEvents: () => void;
}

const MODULE_LABELS: Record<SystemModuleId, string> = {
  graph: 'Graph & OCap',
  ring: 'Hash Ring',
  crdt: 'CRDT',
  merkle: 'Merkle',
  quorum: 'Quorum',
};

export const LiveAnnouncerPanel: React.FC<LiveAnnouncerPanelProps> = ({
  activeModule,
  latestSeverity,
  latestAnnouncement,
  brailleMode,
  events,
  onClearEvents,
}) => {
  const [showUnicodeDots, setShowUnicodeDots] = useState(false);

  const brailleText = useMemo(
    () => formatBrailleAnnouncement(activeModule, latestSeverity, latestAnnouncement),
    [activeModule, latestSeverity, latestAnnouncement]
  );

  const brailleLines = useMemo(
    () => chunkForBrailleCells(brailleText, 40),
    [brailleText]
  );

  return (
    <aside
      aria-label="Accessibility Live Announcer, Braille Buffer, and Audit Log"
      className="flex flex-col rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Live Cluster Announcer
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Screen reader and refreshable Braille status feed
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
          <span>Clear Log</span>
        </button>
      </div>

      {/* ARIA live region */}
      <div
        role={latestSeverity === 'warning' ? 'alert' : 'status'}
        aria-live={latestSeverity === 'warning' ? 'assertive' : 'polite'}
        aria-atomic="true"
        data-testid="live-announcer"
        className="mt-4 rounded-lg bg-[var(--bg-subtle)] p-3.5"
      >
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          Latest Announced Event
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
          {brailleMode ? brailleText : latestAnnouncement}
        </p>
      </div>

      {/* 40-Cell Refreshable Braille Display Buffer */}
      {brailleMode && (
        <div
          data-testid="braille-buffer"
          className="mt-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5"
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
            className="mt-2 space-y-1 font-mono text-xs text-[var(--text-primary)]"
          >
            {brailleLines.map((line, idx) => (
              <li key={idx} className="break-all">
                <span className="text-[var(--text-muted)]">{idx + 1}: </span>
                <span>{showUnicodeDots ? toUnicodeBraille(line) : line}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Chronological event feed */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Operation Log</span>
          <span className="font-mono tabular-nums">{events.length} events</span>
        </div>

        {events.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-hairline)] p-4 text-center text-xs text-[var(--text-muted)]">
            No operations logged yet. Perform an action in any module to record an entry.
          </p>
        ) : (
          <ul
            aria-label="Chronological cluster operations"
            className="max-h-[360px] space-y-2 overflow-y-auto pr-1"
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
