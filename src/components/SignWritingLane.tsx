import React, { useState } from 'react';
import { Check, Copy, MoveHorizontal, MoveVertical } from 'lucide-react';
import type {
  SignContactKind,
  SignHandshapeKind,
  SignMovementKind,
  SignNmmKind,
  SignWritingBox,
  SignWritingDirection,
  SignWritingSequence,
} from '../core/signWriting';

interface SignWritingLaneProps {
  sequence: SignWritingSequence;
  direction: SignWritingDirection;
  onToggleDirection: () => void;
}

const HeadNmmGlyph: React.FC<{ nmm: SignNmmKind }> = ({ nmm }) => {
  return (
    <g stroke="var(--text-primary)" fill="none" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="44" cy="20" r="11" fill="var(--bg-surface)" />
      <circle cx="40" cy="19" r="1" fill="var(--text-primary)" stroke="none" />
      <circle cx="48" cy="19" r="1" fill="var(--text-primary)" stroke="none" />

      {nmm === 'brows-up' && (
        <>
          <path d="M36 14 Q40 11 43 14" />
          <path d="M45 14 Q48 11 52 14" />
          <path d="M40 25 Q44 27 48 25" />
        </>
      )}

      {nmm === 'brows-furrowed' && (
        <>
          <path d="M36 13 L43 16" strokeWidth="1.9" />
          <path d="M52 13 L45 16" strokeWidth="1.9" />
          <line x1="39" y1="25" x2="49" y2="25" />
        </>
      )}

      {nmm === 'headshake' && (
        <>
          <path d="M37 15 L43 17" />
          <path d="M51 15 L45 17" />
          <line x1="39" y1="25" x2="49" y2="25" />
          {/* Left-right headshake arrows */}
          <path d="M27 20 L22 20 M24 17 L21 20 L24 23" stroke="var(--accent-primary)" />
          <path d="M61 20 L66 20 M64 17 L67 20 L64 23" stroke="var(--accent-primary)" />
        </>
      )}

      {nmm === 'nod' && (
        <>
          <path d="M37 15 Q40 13 43 15" />
          <path d="M45 15 Q48 13 51 15" />
          <path d="M40 24 Q44 27 48 24" />
          {/* Vertical nod arrow */}
          <path d="M61 13 L61 27 M58 24 L61 28 L64 24" stroke="var(--accent-primary)" />
        </>
      )}

      {nmm === 'neutral' && (
        <>
          <line x1="37" y1="15" x2="42" y2="15" />
          <line x1="46" y1="15" x2="51" y2="15" />
          <line x1="40" y1="25" x2="48" y2="25" />
        </>
      )}
    </g>
  );
};

const HandshapeGlyph: React.FC<{
  kind: SignHandshapeKind;
  x: number;
  y: number;
  mirrored?: boolean;
}> = ({ kind, x, y, mirrored = false }) => {
  const transform = mirrored
    ? `translate(${x}, ${y}) scale(-1, 1)`
    : `translate(${x}, ${y})`;

  return (
    <g
      transform={transform}
      stroke="var(--text-primary)"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === 'index' && (
        <>
          <rect x="-5" y="0" width="10" height="10" fill="var(--bg-surface)" />
          <line x1="2" y1="0" x2="2" y2="-11" strokeWidth="2.1" />
        </>
      )}

      {kind === 'v-bent' && (
        <>
          <rect x="-5" y="0" width="10" height="10" fill="var(--bg-surface)" />
          <path d="M-2 0 L-4 -9 L-1 -11" fill="none" />
          <path d="M3 0 L5 -9 L2 -11" fill="none" />
        </>
      )}

      {kind === 'open-5' && (
        <>
          <rect x="-6" y="1" width="12" height="9" fill="var(--bg-surface)" />
          <line x1="-6" y1="4" x2="-11" y2="-1" />
          <line x1="-4" y1="1" x2="-6" y2="-9" />
          <line x1="0" y1="1" x2="0" y2="-10" />
          <line x1="4" y1="1" x2="6" y2="-9" />
          <line x1="6" y1="3" x2="10" y2="-5" />
        </>
      )}

      {kind === 'flat-b' && (
        <>
          <rect x="-6" y="-8" width="12" height="18" rx="1" fill="var(--bg-surface)" />
          <line x1="-6" y1="0" x2="6" y2="0" strokeWidth="1.2" />
        </>
      )}

      {kind === 'c-hand' && (
        <path
          d="M5 -8 C-6 -8 -6 9 5 9"
          fill="none"
          strokeWidth="2.3"
        />
      )}

      {kind === 'f-link' && (
        <>
          <circle cx="-2" cy="-2" r="4.5" fill="var(--bg-surface)" />
          <line x1="2" y1="1" x2="3" y2="-9" />
          <line x1="5" y1="2" x2="7" y2="-8" />
          <line x1="7" y1="4" x2="10" y2="-4" />
        </>
      )}

      {kind === 'x-hook' && (
        <>
          <rect x="-5" y="1" width="10" height="9" fill="var(--bg-surface)" />
          <path d="M2 1 L2 -7 L-3 -7 L-3 -3" fill="none" strokeWidth="2.1" />
        </>
      )}

      {kind === 'fist-a' && (
        <>
          <rect x="-6" y="-2" width="12" height="11" rx="1.5" fill="var(--text-primary)" />
          <line x1="-6" y1="2" x2="-9" y2="-3" strokeWidth="2" />
        </>
      )}
    </g>
  );
};

const ContactGlyph: React.FC<{ contact: SignContactKind }> = ({ contact }) => {
  if (contact === 'none') return null;
  if (contact === 'touch') {
    return (
      <g stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round">
        <line x1="44" y1="42" x2="44" y2="50" />
        <line x1="40" y1="44" x2="48" y2="48" />
        <line x1="48" y1="44" x2="40" y2="48" />
      </g>
    );
  }
  if (contact === 'grasp') {
    return (
      <g stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round">
        <line x1="44" y1="41" x2="44" y2="51" />
        <line x1="39" y1="46" x2="49" y2="46" />
      </g>
    );
  }
  return (
    <g stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round">
      <line x1="40" y1="42" x2="48" y2="50" />
      <line x1="48" y1="42" x2="40" y2="50" />
    </g>
  );
};

const MovementGlyph: React.FC<{ movement: SignMovementKind }> = ({ movement }) => {
  return (
    <g
      stroke="var(--accent-primary)"
      fill="none"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {movement === 'arc-path' && (
        <>
          <path d="M22 72 Q44 58 66 72" />
          <path d="M62 67 L67 72 L60 74" />
        </>
      )}

      {movement === 'forward' && (
        <>
          <line x1="42" y1="77" x2="42" y2="63" />
          <line x1="46" y1="77" x2="46" y2="63" />
          <path d="M39 66 L44 60 L49 66" />
        </>
      )}

      {movement === 'together' && (
        <>
          <path d="M18 70 L37 70 M33 66 L38 70 L33 74" />
          <path d="M70 70 L51 70 M55 66 L50 70 L55 74" />
        </>
      )}

      {movement === 'apart' && (
        <>
          <path d="M39 70 L20 70 M25 66 L19 70 L25 74" />
          <path d="M49 70 L68 70 M63 66 L69 70 L63 74" />
        </>
      )}

      {movement === 'gather' && (
        <>
          <path d="M20 64 Q28 74 41 72" />
          <path d="M68 64 Q60 74 47 72" />
          <circle cx="44" cy="72" r="2" fill="var(--accent-primary)" />
        </>
      )}

      {movement === 'twist' && (
        <>
          <path d="M32 72 C32 63 56 63 56 72" />
          <path d="M52 68 L57 73 L59 66" />
        </>
      )}

      {movement === 'halt' && (
        <>
          <line x1="26" y1="71" x2="62" y2="71" strokeWidth="3.2" />
          <line x1="44" y1="61" x2="44" y2="70" />
        </>
      )}
    </g>
  );
};

const SignWritingBoxCard: React.FC<{ box: SignWritingBox; stepNumber: number }> = ({
  box,
  stepNumber,
}) => {
  return (
    <div className="flex flex-col items-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2">
      <div className="mb-1 flex w-full items-center justify-between gap-1 text-[10px] font-mono text-[var(--text-muted)]">
        <span>#{stepNumber}</span>
        <span>{box.hands}H</span>
      </div>
      <svg
        viewBox="0 0 88 84"
        className="h-20 w-20"
        role="img"
        aria-label={box.ariaDescription}
      >
        <HeadNmmGlyph nmm={box.nmm} />
        {box.hands === 2 ? (
          <>
            <HandshapeGlyph kind={box.handshape} x={27} y={48} mirrored />
            <HandshapeGlyph kind={box.handshape} x={61} y={48} />
          </>
        ) : (
          <HandshapeGlyph kind={box.handshape} x={44} y={48} />
        )}
        <ContactGlyph contact={box.contact} />
        <MovementGlyph movement={box.movement} />
      </svg>
      <span className="mt-1 text-center font-mono text-[11px] font-semibold leading-tight text-[var(--text-primary)]">
        {box.localizedGloss}
      </span>
      <span
        className="mt-0.5 text-center font-mono text-[10px] text-[var(--text-muted)]"
        title={`FSW: ${box.fswToken}`}
      >
        {box.swuChars}
      </span>
    </div>
  );
};

export const SignWritingLane: React.FC<SignWritingLaneProps> = ({
  sequence,
  direction,
  onToggleDirection,
}) => {
  const [encodingView, setEncodingView] = useState<'fsw' | 'swu'>('fsw');
  const [copied, setCopied] = useState(false);

  const encodingText = encodingView === 'fsw' ? sequence.fsw : sequence.swu;

  const handleCopyEncoding = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(encodingText).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div data-testid="signwriting-lane" className="space-y-2.5">
      {/* Metadata & Layout Direction Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-primary)]">
            {sequence.language.code}
          </span>{' '}
          · {sequence.language.syntaxOrder.toUpperCase()} ·{' '}
          {sequence.language.alphabetType === 'two-handed' ? '2H manual' : '1H manual'}
        </div>

        <button
          type="button"
          onClick={onToggleDirection}
          aria-pressed={direction === 'horizontal'}
          className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
        >
          {direction === 'vertical' ? (
            <>
              <MoveVertical className="h-3 w-3" aria-hidden="true" />
              <span>Vertical Lane</span>
            </>
          ) : (
            <>
              <MoveHorizontal className="h-3 w-3" aria-hidden="true" />
              <span>Horizontal Lane</span>
            </>
          )}
        </button>
      </div>

      {/* Gloss Sequence Summary */}
      <div className="rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
        <p className="text-[11px] font-semibold text-[var(--text-muted)]">
          {sequence.language.name} Gloss Sequence
        </p>
        <p className="mt-0.5 font-mono text-xs font-semibold text-[var(--text-primary)]">
          {sequence.localizedGlossLine}
        </p>
      </div>

      {/* 2D Sutton SignWriting Spatial SignBoxes */}
      <div
        role="region"
        aria-label={`${sequence.language.name} SignWriting ${direction} lane with ${sequence.boxes.length} sign boxes`}
        className={
          direction === 'vertical'
            ? 'mx-auto grid max-w-[190px] grid-cols-1 gap-2 rounded-lg bg-[var(--bg-subtle)] p-2.5'
            : 'grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-subtle)] p-2.5 sm:grid-cols-3'
        }
      >
        {sequence.boxes.map((box, idx) => (
          <SignWritingBoxCard key={box.id} box={box} stepNumber={idx + 1} />
        ))}
      </div>

      {/* FSW / Unicode SWU Encoding Inspector */}
      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label="SignWriting encoding notation" className="inline-flex rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5">
            <button
              type="button"
              onClick={() => setEncodingView('fsw')}
              aria-pressed={encodingView === 'fsw'}
              className={`rounded px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                encodingView === 'fsw'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text-on)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              FSW (ASCII)
            </button>
            <button
              type="button"
              onClick={() => setEncodingView('swu')}
              aria-pressed={encodingView === 'swu'}
              className={`rounded px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                encodingView === 'swu'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text-on)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Unicode SWU
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyEncoding}
            aria-label={`Copy ${encodingView.toUpperCase()} SignWriting string`}
            className="inline-flex min-h-[26px] items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[var(--accent-primary)]" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <p
          data-testid="signwriting-encoding-text"
          className="mt-2 break-all font-mono text-[11px] leading-relaxed text-[var(--text-primary)]"
        >
          {encodingText}
        </p>
      </div>
    </div>
  );
};
