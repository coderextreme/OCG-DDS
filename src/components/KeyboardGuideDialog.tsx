import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface KeyboardGuideDialogProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUT_ROWS = [
  {
    keys: 'Tab / Shift + Tab',
    scope: 'Global',
    action:
      'Move focus forward or backward across all interactive controls, forms, shard zones, and tables.',
  },
  {
    keys: 'ArrowLeft / ArrowRight',
    scope: 'Graph, Ring & Merkle Tree',
    action:
      'Step sequentially across distributed graph nodes, ring keys, or Merkle tree buckets without using a mouse.',
  },
  {
    keys: 'Home / End',
    scope: 'Graph, Ring & Merkle Tree',
    action: 'Jump directly to the first or last node in the active structure.',
  },
  {
    keys: 'Alt + 1..4',
    scope: 'Global',
    action:
      'Switch directly between Graph Workspace, Sync & Quorum, Hash Sharding, and Capabilities.',
  },
  {
    keys: 'Alt + E',
    scope: 'Global',
    action:
      'Open and focus the Multi-Modal Edit Console to edit nodes, arcs, data structures, or capabilities via text or Unicode Braille.',
  },
  {
    keys: 'F D S / J K L',
    scope: '6-Dot Braille Editor',
    action:
      'Toggle Braille Dots 1-3 (left hand) and Dots 4-6 (right hand), Space commits cell, Backspace deletes cell, Enter executes command.',
  },
  {
    keys: 'ASL / PT Builder',
    scope: 'Edit Console',
    action:
      'Compose Topic-Comment (NODE / ARC / CAPABILITY / QUORUM) edits mapped to Protactile Spatial Zones A, B, and C with optional tactile pulse.',
  },
  {
    keys: 'Edit & - / + Steppers',
    scope: 'Tables & Quorum',
    action:
      'Every node, arc, key, register, and active capability row includes a keyboard Edit button; Quorum W/R sliders include discrete - / + steppers.',
  },
  {
    keys: 'Output Channel',
    scope: 'Toolbar / Announcer',
    action:
      'Switch live announcements between Standard, 40-cell Braille (+ Unicode dots), Protactile Language (+ haptic pulse patterns), American Sign Language (ASL Gloss + Sign Cards), and Sutton SignWriting (2D SignBoxes, FSW & Unicode SWU) in any international or custom sign language.',
  },
  {
    keys: '?',
    scope: 'Global (outside inputs)',
    action: 'Open this Keyboard & Accessibility Reference dialog.',
  },
  {
    keys: 'Escape',
    scope: 'Dialog',
    action: 'Close this dialog and return focus to the triggering control.',
  },
];

export const KeyboardGuideDialog: React.FC<KeyboardGuideDialogProps> = ({ open, onClose }) => {
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
              Keyboard Navigation and Accessibility Guide
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Every distributed visualization includes a keyboard-operable canvas, structured tables, and Braille, Protactile, and ASL outputs.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close keyboard guide"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-muted)]">
                <th scope="col" className="py-2 pr-4">Shortcut</th>
                <th scope="col" className="py-2 pr-4">Context</th>
                <th scope="col" className="py-2">Behavior</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUT_ROWS.map((row) => (
                <tr key={row.keys} className="border-b border-[var(--border-hairline)] last:border-b-0">
                  <td className="py-2.5 pr-4 font-mono text-xs font-semibold whitespace-nowrap text-[var(--accent-primary)]">
                    {row.keys}
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                    {row.scope}
                  </td>
                  <td className="py-2.5 text-sm text-[var(--text-secondary)]">
                    {row.action}
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
