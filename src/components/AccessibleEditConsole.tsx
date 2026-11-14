import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Delete,
  Hand,
  Keyboard,
  Play,
  Terminal,
} from 'lucide-react';
import {
  dotsToBrailleCell,
  fromUnicodeBraille,
} from '../core/accessibleEditing';
import type { AccessibleOutputChannel } from '../types/system';

type InputModality = 'command' | 'braille' | 'asl-pt';

interface AccessibleEditConsoleProps {
  outputChannel: AccessibleOutputChannel;
  nodeIds: string[];
  arcIds: string[];
  capabilityIds: string[];
  focusSignal?: number;
  onExecuteCommand: (rawCommand: string) => {
    ok: boolean;
    summary: string;
    decodedCommand: string;
  };
}

const BRAILLE_DOTS: Array<{ dot: number; keyHint: string; hand: 'Left' | 'Right' }> = [
  { dot: 1, keyHint: 'F', hand: 'Left' },
  { dot: 2, keyHint: 'D', hand: 'Left' },
  { dot: 3, keyHint: 'S', hand: 'Left' },
  { dot: 4, keyHint: 'J', hand: 'Right' },
  { dot: 5, keyHint: 'K', hand: 'Right' },
  { dot: 6, keyHint: 'L', hand: 'Right' },
];

const QUICK_TEMPLATES: Array<{ label: string; command: string }> = [
  { label: 'Add Node', command: 'add node N6 "Edge Cache" Shard-B edge' },
  { label: 'Update Node', command: 'update node N3 label="Primary Ledger" status=active' },
  { label: 'Add Arc', command: 'add arc A6 N3->N5 audit-mirror w=9' },
  { label: 'Batch Edit', command: 'batch add node N7 "Sync Node" Shard-C | add arc A7 N4->N7 sync w=5' },
  { label: 'Edit OCap', command: 'cap edit cap-shard-b label="Zone-B Operator"' },
  { label: 'CRDT Tag', command: 'crdt add R1 accessible:ok' },
  { label: 'Ring Put', command: 'ring put key:node-6 active' },
  { label: 'Quorum W/R', command: 'quorum set w=4 r=2' },
];

export const AccessibleEditConsole: React.FC<AccessibleEditConsoleProps> = ({
  outputChannel,
  nodeIds,
  arcIds,
  capabilityIds,
  focusSignal = 0,
  onExecuteCommand,
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [modality, setModality] = useState<InputModality>(() =>
    outputChannel === 'braille'
      ? 'braille'
      : outputChannel === 'asl' || outputChannel === 'protactile'
        ? 'asl-pt'
        : 'command'
  );
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSignal === 0) return;
    setExpanded(true);
    setModality('command');
    setTimeout(() => commandInputRef.current?.focus(), 0);
  }, [focusSignal]);

  // Command input state
  const [commandText, setCommandText] = useState<string>('');
  const [consoleFeedback, setConsoleFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // Perkins 6-dot Braille keyboard state
  const [activeDots, setActiveDots] = useState<number[]>([]);
  const [brailleBuffer, setBrailleBuffer] = useState<string>('');
  const [perkinsKeyboardMode, setPerkinsKeyboardMode] = useState<boolean>(false);

  // ASL Gloss & Protactile Spatial Clause Builder state
  const [builderTopic, setBuilderTopic] = useState<'NODE' | 'ARC' | 'CAPABILITY' | 'QUORUM'>('NODE');
  const [builderAction, setBuilderAction] = useState<'CREATE' | 'UPDATE' | 'DELETE'>('UPDATE');
  const [builderTargetId, setBuilderTargetId] = useState<string>(nodeIds[0] ?? 'N1');
  const [builderZone, setBuilderZone] = useState<'Shard-A' | 'Shard-B' | 'Shard-C'>('Shard-B');
  const [builderStatus, setBuilderStatus] = useState<'active' | 'maintenance' | 'isolated'>('active');
  const [builderLabel, setBuilderLabel] = useState<string>('Accessible Node');
  const [builderSecondId, setBuilderSecondId] = useState<string>(nodeIds[2] ?? 'N3');

  const decodedBraillePreview = useMemo(
    () => fromUnicodeBraille(brailleBuffer),
    [brailleBuffer]
  );

  const previewCell = useMemo(() => dotsToBrailleCell(activeDots), [activeDots]);

  const assembledAslPtCommand = useMemo(() => {
    if (builderTopic === 'NODE') {
      if (builderAction === 'CREATE') {
        const safeId = builderTargetId.trim() || 'N6';
        const safeLabel = builderLabel.trim() || 'New Node';
        return `NODE ${safeId} CREATE "${safeLabel}" ${builderZone}`;
      }
      if (builderAction === 'DELETE') {
        return `NODE ${builderTargetId} DELETE`;
      }
      const safeLabel = builderLabel.trim();
      return `NODE ${builderTargetId} UPDATE ${safeLabel ? `label="${safeLabel}" ` : ''}shard=${builderZone} status=${builderStatus}`;
    }
    if (builderTopic === 'ARC') {
      if (builderAction === 'CREATE') {
        const safeId = builderTargetId.trim() || 'A6';
        const safeLabel = builderLabel.trim() || 'connect';
        return `ARC ${safeId} ${nodeIds[0] ?? 'N1'}->${builderSecondId || 'N3'} CREATE "${safeLabel}" w=10`;
      }
      if (builderAction === 'DELETE') {
        return `ARC ${builderTargetId} DELETE`;
      }
      const safeLabel = builderLabel.trim();
      return `ARC ${builderTargetId} UPDATE ${safeLabel ? `label="${safeLabel}" ` : ''}status=${builderStatus}`;
    }
    if (builderTopic === 'CAPABILITY') {
      if (builderAction === 'DELETE') {
        return `cap revoke ${builderTargetId}`;
      }
      if (builderAction === 'CREATE') {
        const safeLabel = builderLabel.trim() || 'Zone Operator';
        return `cap mint "${safeLabel}" "ASL/PT User" ${builderZone} read,update`;
      }
      const safeLabel = builderLabel.trim() || 'Updated Token';
      return `cap edit ${builderTargetId} label="${safeLabel}"`;
    }
    return `quorum set w=3 r=3`;
  }, [
    builderTopic,
    builderAction,
    builderTargetId,
    builderZone,
    builderStatus,
    builderLabel,
    builderSecondId,
    nodeIds,
  ]);

  const handleRunCommand = (raw: string) => {
    const res = onExecuteCommand(raw);
    setConsoleFeedback({
      ok: res.ok,
      text: res.summary,
    });
    if (res.ok && outputChannel === 'protactile' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([100, 50, 140]);
    }
  };

  const toggleDot = (dot: number) => {
    setActiveDots((prev) =>
      prev.includes(dot) ? prev.filter((d) => d !== dot) : [...prev, dot].sort()
    );
  };

  const commitActiveCell = () => {
    if (activeDots.length === 0) {
      setBrailleBuffer((b) => b + '⠀');
      return;
    }
    const cell = dotsToBrailleCell(activeDots);
    setBrailleBuffer((b) => b + cell.unicode);
    setActiveDots([]);
  };

  const handlePerkinsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!perkinsKeyboardMode) return;
    const key = e.key.toLowerCase();
    const map: Record<string, number> = {
      f: 1,
      d: 2,
      s: 3,
      j: 4,
      k: 5,
      l: 6,
    };
    if (key in map) {
      e.preventDefault();
      toggleDot(map[key]);
    } else if (e.key === ' ') {
      e.preventDefault();
      commitActiveCell();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setBrailleBuffer((b) => b.slice(0, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleRunCommand(brailleBuffer);
    }
  };

  return (
    <section
      aria-label="Universal Accessible Editor for Blind, Deaf-Blind, and Deaf Users"
      className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 sm:px-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Multi-Modal Edit Console (Screen Reader · Braille · Protactile · ASL)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {expanded && (
            <div
              role="tablist"
              aria-label="Accessible editing input mode"
              className="flex flex-wrap max-w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-0.5 gap-0.5"
            >
              {[
                { id: 'command' as const, label: 'Command / SR' },
                { id: 'braille' as const, label: '6-Dot Braille' },
                { id: 'asl-pt' as const, label: 'ASL / Protactile Builder' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={modality === m.id}
                  onClick={() => setModality(m.id)}
                  className={`min-h-[30px] rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer ${
                    modality === m.id
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-text-on)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-[var(--border-hairline)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <span>{expanded ? 'Hide Editor' : 'Open Editor'}</span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-[var(--border-hairline)] pt-3 space-y-3">
          {/* MODE 1: Command / Screen Reader / Unicode Braille Text Input */}
          {modality === 'command' && (
            <div className="space-y-2.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunCommand(commandText);
                }}
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <label
                    htmlFor="accessible-command-input"
                    className="block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    Enter Graph, Data-Structure, or Capability Edit (ASCII, ASL order, or Unicode Braille ⠁-⠿)
                  </label>
                  <input
                    ref={commandInputRef}
                    id="accessible-command-input"
                    type="text"
                    value={commandText}
                    onChange={(e) => setCommandText(e.target.value)}
                    placeholder='e.g. update node N3 label="Core Ledger" shard=Shard-B | cap use cap-shard-b'
                    className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-xs sm:text-sm text-[var(--text-primary)]"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] whitespace-nowrap cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Execute Edit</span>
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  Templates:
                </span>
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => setCommandText(tpl.command)}
                    className="rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MODE 2: 6-Dot Perkins Braille Chorded Input */}
          {modality === 'braille' && (
            <div
              tabIndex={0}
              onKeyDown={handlePerkinsKeyDown}
              aria-label="Perkins 6-dot Braille editor. Toggle dot buttons or enable F D S J K L chord typing."
              className="space-y-3 rounded-lg bg-[var(--bg-subtle)] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    6-Dot Perkins Braille Cell Entry
                  </span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={perkinsKeyboardMode}
                    onChange={(e) => setPerkinsKeyboardMode(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--accent-primary)]"
                  />
                  <span>Capture F/D/S (Dots 1-3) &amp; J/K/L (Dots 4-6)</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {BRAILLE_DOTS.map(({ dot, keyHint, hand }) => {
                  const active = activeDots.includes(dot);
                  return (
                    <button
                      key={dot}
                      type="button"
                      onClick={() => toggleDot(dot)}
                      aria-pressed={active}
                      className={`min-h-[38px] rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold cursor-pointer ${
                        active
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-text-on)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                      }`}
                    >
                      Dot {dot} ({hand} {keyHint})
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={commitActiveCell}
                  className="min-h-[36px] rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-text-on)] cursor-pointer"
                >
                  Commit Cell ({previewCell.unicode} {previewCell.ascii || 'mod/space'})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBrailleBuffer((b) => b + '⠀');
                    setActiveDots([]);
                  }}
                  className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  Space Cell
                </button>
                <button
                  type="button"
                  onClick={() => setBrailleBuffer((b) => b.slice(0, -1))}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  <Delete className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Backspace</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBrailleBuffer('');
                    setActiveDots([]);
                  }}
                  className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleRunCommand(brailleBuffer)}
                  className="ml-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-1.5 text-xs font-semibold text-[var(--accent-text-on)] cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Execute Braille Command</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="braille-unicode-buffer"
                    className="block text-[11px] font-semibold text-[var(--text-muted)]"
                  >
                    Unicode Braille Buffer (Paste or Chord)
                  </label>
                  <input
                    id="braille-unicode-buffer"
                    type="text"
                    value={brailleBuffer}
                    onChange={(e) => setBrailleBuffer(e.target.value)}
                    placeholder="⠁⠙⠙⠀⠝⠕⠙⠑⠀⠝⠼⠋⠀⠉⠁⠉⠓⠑"
                    className="mt-1 w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-[var(--text-muted)]">
                    Decoded Grade-1 ASCII Preview
                  </span>
                  <div
                    role="status"
                    className="mt-1 min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
                  >
                    {decodedBraillePreview || '(empty buffer)'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: ASL Topic-Comment & Protactile Spatial Zone Builder */}
          {modality === 'asl-pt' && (
            <div className="space-y-3 rounded-lg bg-[var(--bg-subtle)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                  <Hand className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
                  <span>ASL Topic-Comment &amp; Protactile Zone Editor</span>
                </span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  Clause: {assembledAslPtCommand}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
                <div>
                  <label
                    htmlFor="asl-topic-select"
                    className="block text-[11px] font-medium text-[var(--text-secondary)]"
                  >
                    Topic (Structure)
                  </label>
                  <select
                    id="asl-topic-select"
                    value={builderTopic}
                    onChange={(e) => {
                      const next = e.target.value as typeof builderTopic;
                      setBuilderTopic(next);
                      if (next === 'NODE') setBuilderTargetId(nodeIds[0] ?? 'N1');
                      if (next === 'ARC') setBuilderTargetId(arcIds[0] ?? 'A1');
                      if (next === 'CAPABILITY') setBuilderTargetId(capabilityIds[0] ?? 'cap-root');
                    }}
                    className="mt-1 w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                  >
                    <option value="NODE">NODE</option>
                    <option value="ARC">ARC</option>
                    <option value="CAPABILITY">CAPABILITY</option>
                    <option value="QUORUM">QUORUM</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="asl-action-select"
                    className="block text-[11px] font-medium text-[var(--text-secondary)]"
                  >
                    Sign Action
                  </label>
                  <select
                    id="asl-action-select"
                    value={builderAction}
                    onChange={(e) => setBuilderAction(e.target.value as typeof builderAction)}
                    className="mt-1 w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                  >
                    <option value="UPDATE">UPDATE</option>
                    <option value="CREATE">CREATE</option>
                    <option value="DELETE">DELETE / REVOKE</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="asl-target-id"
                    className="block text-[11px] font-medium text-[var(--text-secondary)]"
                  >
                    Target ID
                  </label>
                  <input
                    id="asl-target-id"
                    type="text"
                    value={builderTargetId}
                    onChange={(e) => setBuilderTargetId(e.target.value)}
                    className="mt-1 w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pt-zone-select"
                    className="block text-[11px] font-medium text-[var(--text-secondary)]"
                  >
                    Protactile Spatial Zone
                  </label>
                  <select
                    id="pt-zone-select"
                    value={builderZone}
                    onChange={(e) => setBuilderZone(e.target.value as typeof builderZone)}
                    className="mt-1 w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="Shard-A">Zone A · Left Forearm (Shard-A)</option>
                    <option value="Shard-B">Zone B · Center Palm (Shard-B)</option>
                    <option value="Shard-C">Zone C · Right Forearm (Shard-C)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="asl-label-input"
                    className="block text-[11px] font-medium text-[var(--text-secondary)]"
                  >
                    {builderTopic === 'ARC' && builderAction === 'CREATE'
                      ? 'Target Node / Label'
                      : 'Label'}
                  </label>
                  <input
                    id="asl-label-input"
                    type="text"
                    value={builderLabel}
                    onChange={(e) => setBuilderLabel(e.target.value)}
                    className="mt-1 w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex items-end">
                  {builderTopic === 'ARC' && builderAction === 'CREATE' ? (
                    <div className="w-full space-y-1">
                      <select
                        aria-label="Target Node for new arc"
                        value={builderSecondId}
                        onChange={(e) => setBuilderSecondId(e.target.value)}
                        className="w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1.5 font-mono text-xs text-[var(--text-primary)]"
                      >
                        {nodeIds.map((nid) => (
                          <option key={nid} value={nid}>
                            to {nid}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="w-full">
                      <label
                        htmlFor="asl-status-select"
                        className="block text-[11px] font-medium text-[var(--text-secondary)]"
                      >
                        State
                      </label>
                      <select
                        id="asl-status-select"
                        value={builderStatus}
                        onChange={(e) =>
                          setBuilderStatus(e.target.value as typeof builderStatus)
                        }
                        className="mt-1 w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                      >
                        <option value="active">active</option>
                        <option value="maintenance">maintenance</option>
                        <option value="isolated">isolated</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRunCommand(assembledAslPtCommand)}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-1.5 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Commit ASL / Protactile Edit</span>
                </button>
              </div>
            </div>
          )}

          {consoleFeedback && (
            <div
              role={consoleFeedback.ok ? 'status' : 'alert'}
              className={`flex items-center gap-2 text-xs font-semibold ${
                consoleFeedback.ok
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{consoleFeedback.text}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
