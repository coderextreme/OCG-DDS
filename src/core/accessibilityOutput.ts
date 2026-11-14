import { hashString32 } from './hashRing';
import {
  type CapabilityRight,
  type CapabilityToken,
  type GraphArc,
  type GraphNode,
  isCapabilityActive,
} from './ocapGraph';

export type AccessibleOutputChannel =
  | 'standard'
  | 'braille'
  | 'protactile'
  | 'asl';

export interface AslSignStep {
  gloss: string;
  handshape: string;
  location: string;
  movement: string;
  nonManualMarker: string;
}

export interface ProtactileCue {
  contactSetup: string;
  spatialZone: string;
  topographicTrace: string;
  backchannel: string;
  hapticPatternMs: number[];
}

export interface AccessibleEventBundle {
  standard: string;
  brailleLines: string[];
  brailleDots: string[];
  protactile: ProtactileCue;
  aslGloss: string;
  aslSteps: AslSignStep[];
}

// Grade-1 North American / Unified English Braille ASCII-to-Unicode mapping
const BRAILLE_MAP: Record<string, string> = {
  ' ': '⠀',
  a: '⠁',
  b: '⠃',
  c: '⠉',
  d: '⠙',
  e: '⠑',
  f: '⠋',
  g: '⠛',
  h: '⠓',
  i: '⠊',
  j: '⠚',
  k: '⠅',
  l: '⠇',
  m: '⠍',
  n: '⠝',
  o: '⠕',
  p: '⠏',
  q: '⠟',
  r: '⠗',
  s: '⠎',
  t: '⠞',
  u: '⠥',
  v: '⠧',
  w: '⠺',
  x: '⠭',
  y: '⠽',
  z: '⠵',
  '1': '⠼⠁',
  '2': '⠼⠃',
  '3': '⠼⠉',
  '4': '⠼⠙',
  '5': '⠼⠑',
  '6': '⠼⠋',
  '7': '⠼⠛',
  '8': '⠼⠓',
  '9': '⠼⠊',
  '0': '⠼⠚',
  '.': '⠲',
  ',': '⠂',
  ':': '⠒',
  ';': '⠆',
  '-': '⠤',
  '/': '⠌',
  '|': '⠳',
  '>': '⠜',
  '<': '⠣',
  '=': '⠶',
  '(': '⠐⠣',
  ')': '⠐⠜',
  '[': '⠨⠣',
  ']': '⠨⠜',
};

export function toUnicodeBraille(text: string): string {
  const lower = text.toLowerCase();
  let out = '';
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    out += BRAILLE_MAP[ch] ?? '⠐';
  }
  return out;
}

export function chunkForBrailleCells(text: string, cellWidth: 40 | 80 = 40): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [''];

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      if (word.length <= cellWidth) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += cellWidth) {
          lines.push(word.slice(i, i + cellWidth));
        }
      }
    } else if (current.length + 1 + word.length <= cellWidth) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      if (word.length <= cellWidth) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += cellWidth) {
          const slice = word.slice(i, i + cellWidth);
          if (i + cellWidth < word.length) {
            lines.push(slice);
          } else {
            current = slice;
          }
        }
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function formatBrailleAnnouncement(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string
): string {
  const prefix =
    severity === 'warning' ? 'ALERT' : severity === 'success' ? 'OK' : 'INFO';
  return `[${prefix} ${moduleTag.toUpperCase()}] ${summary}`;
}

/**
 * Translates a distributed graph/system event into Protactile Language (PT)
 * contact-space notation, topographic tracing, backchannel cues, and haptic pulse patterns.
 */
export function formatProtactileCue(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string
): ProtactileCue {
  const lower = summary.toLowerCase();
  const shardMatch = summary.match(/Shard-[ABC]/i)?.[0]?.toUpperCase();
  const spatialZone =
    shardMatch === 'SHARD-A'
      ? 'Left Forearm Anchor (Zone A)'
      : shardMatch === 'SHARD-B'
        ? 'Center Palm / Wrist Anchor (Zone B)'
        : shardMatch === 'SHARD-C'
          ? 'Right Forearm Anchor (Zone C)'
          : `Contact Canvas (${moduleTag.toUpperCase()})`;

  let topographicTrace = `TRACE: Steady point press for "${summary}"`;
  if (lower.includes('arc') || summary.includes('->')) {
    topographicTrace =
      'TRACE: Press source anchor, slide 1-finger linear arc to target anchor';
  } else if (lower.includes('batch') || lower.includes('group')) {
    topographicTrace =
      'TRACE: Two-hand sweep enclosing selected group boundary, then firm tap-commit';
  } else if (lower.includes('denied') || lower.includes('revoked')) {
    topographicTrace =
      'TRACE: Crossed-bar press on active capability wrist anchor (blocked boundary)';
  } else if (lower.includes('partition') || lower.includes('offline')) {
    topographicTrace =
      'TRACE: Lift-off break along replica link line (connection severed)';
  } else if (lower.includes('converg') || lower.includes('sync') || lower.includes('repair')) {
    topographicTrace =
      'TRACE: Bilateral inward palm sweep bringing replica anchors together';
  }

  const backchannel =
    severity === 'warning'
      ? 'DOUBLE-TAP-HOLD (Alert / Boundary Stop)'
      : severity === 'success'
        ? 'FIRM-SINGLE-TAP (Confirmed / Committed)'
        : 'LIGHT-TAP (Status Update)';

  const hapticPatternMs =
    severity === 'warning'
      ? [180, 80, 180, 80, 300]
      : severity === 'success'
        ? [120, 60, 180]
        : [90];

  return {
    contactSetup: 'CONTACT-SPACE: Grounded two-hand frame active',
    spatialZone,
    topographicTrace,
    backchannel,
    hapticPatternMs,
  };
}

/**
 * Translates a distributed graph/system event into American Sign Language (ASL)
 * Topic-Comment Gloss, Non-Manual Markers (NMMs), and structured sign steps.
 */
export function formatAslOutput(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string
): { gloss: string; steps: AslSignStep[] } {
  const lower = summary.toLowerCase();
  const steps: AslSignStep[] = [];

  if (lower.includes('denied') || lower.includes('revoked')) {
    steps.push(
      {
        gloss: 'KEY / AUTHORITY',
        handshape: 'X-hook + flat-B palm',
        location: 'Dominant palm center',
        movement: 'Twist key hand once, then freeze',
        nonManualMarker: 'brows-furrowed',
      },
      {
        gloss: 'ACCESS FORBIDDEN',
        handshape: 'Flat-B blade',
        location: 'Chest / neutral space',
        movement: 'Crossed block outward',
        nonManualMarker: 'headshake',
      },
      {
        gloss: 'IX-LOC ACTION STOP',
        handshape: '1-index + flat-5',
        location: 'Target shard locus',
        movement: 'Firm downward halt',
        nonManualMarker: 'lips-pressed',
      }
    );
    return {
      gloss: `[brows-furrowed] AUTHORITY KEY ++ ACTION FORBIDDEN IX-locus STOP [headshake]`,
      steps,
    };
  }

  if (lower.includes('batch') || lower.includes('group')) {
    steps.push(
      {
        gloss: 'GROUP CLUSTER',
        handshape: 'C-hands (both)',
        location: 'Neutral signing space',
        movement: 'Cup outward gathering nodes into one set',
        nonManualMarker: 'raised-brows (topic)',
      },
      {
        gloss: 'TOGETHER APPLY / COMMIT',
        handshape: 'A-fists -> S-grip',
        location: 'Center space',
        movement: 'Single unified downward lock',
        nonManualMarker: 'nod',
      }
    );
    return {
      gloss: `[raised-brows] GROUP NODES+ARCS CL:C-gather ++ TOGETHER COMMIT [nod]`,
      steps,
    };
  }

  if (lower.includes('arc') || summary.includes('->')) {
    steps.push(
      {
        gloss: 'NODE IX-left TO IX-right',
        handshape: '1-index + 1-index',
        location: 'Left-to-right spatial plane',
        movement: 'Trace directional path from source to target',
        nonManualMarker: 'eyes-track-path',
      },
      {
        gloss: 'LINK CONNECT FINISH',
        handshape: 'F-ok link',
        location: 'Center plane',
        movement: 'Interlock rings + quick wrist flip',
        nonManualMarker: 'nod',
      }
    );
    return {
      gloss: `[topic] NODE IX-source ARC-CONNECT-IX-target CL:1-path FINISH [nod]`,
      steps,
    };
  }

  if (lower.includes('partition') || lower.includes('offline') || lower.includes('fail')) {
    steps.push(
      {
        gloss: 'NODE / REPLICA',
        handshape: 'V-bent / 4-hand',
        location: 'Right spatial locus',
        movement: 'Drop hand down / separate',
        nonManualMarker: 'brows-furrowed',
      },
      {
        gloss: 'BREAK-APART ISOLATED',
        handshape: 'S-fists -> open-5',
        location: 'Neutral space',
        movement: 'Pull hands apart sharply',
        nonManualMarker: 'headshake-slight',
      }
    );
    return {
      gloss: `[brows-furrowed] IX-replica LINK BREAK-APART ISOLATED [alert]`,
      steps,
    };
  }

  if (lower.includes('converg') || lower.includes('sync') || lower.includes('repair')) {
    steps.push(
      {
        gloss: 'ALL REPLICA',
        handshape: '5-hand sweep',
        location: 'Horizontal arc',
        movement: 'Sweep across left-center-right loci',
        nonManualMarker: 'raised-brows',
      },
      {
        gloss: 'MERGE SAME-EQUAL',
        handshape: '5-hands -> 1-index pair',
        location: 'Center space',
        movement: 'Bring both hands together evenly',
        nonManualMarker: 'nod',
      }
    );
    return {
      gloss: `[topic] ALL REPLICA IX-all MERGE MATCH SAME FINISH [nod]`,
      steps,
    };
  }

  // General structured ASL gloss for node/state updates
  const nmm = severity === 'warning' ? 'brows-furrowed' : 'nod';
  steps.push(
    {
      gloss: `${moduleTag.toUpperCase()} TOPIC`,
      handshape: 'Flat-B / 1-index',
      location: 'Center signing space',
      movement: 'Point to spatial topic anchor',
      nonManualMarker: 'raised-brows (topic)',
    },
    {
      gloss: severity === 'success' ? 'DONE / CONFIRMED' : 'UPDATE STATE',
      handshape: '5-hands (finish) / F-hand',
      location: 'Neutral space',
      movement: severity === 'success' ? 'Two-hand crisp outward turn' : 'Steady forward placement',
      nonManualMarker: nmm,
    }
  );

  return {
    gloss: `[raised-brows] ${moduleTag.toUpperCase()} IX-locus :: ${summary.toUpperCase()} [${nmm}]`,
    steps,
  };
}

export function buildAccessibleEventBundle(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string
): AccessibleEventBundle {
  const brailleCompact = formatBrailleAnnouncement(moduleTag, severity, summary);
  const brailleLines = chunkForBrailleCells(brailleCompact, 40);
  const brailleDots = brailleLines.map((line) => toUnicodeBraille(line));
  const protactile = formatProtactileCue(moduleTag, severity, summary);
  const asl = formatAslOutput(moduleTag, severity, summary);

  return {
    standard: summary,
    brailleLines,
    brailleDots,
    protactile,
    aslGloss: asl.gloss,
    aslSteps: asl.steps,
  };
}

export function describeGraphNodeAccessibility(
  node: GraphNode,
  arcs: GraphArc[],
  activeCap: CapabilityToken | undefined,
  allCaps: CapabilityToken[]
): {
  canUpdate: boolean;
  canDelete: boolean;
  outgoingCount: number;
  incomingCount: number;
  guardLabel: string;
} {
  const active = activeCap ? isCapabilityActive(activeCap.id, allCaps) : false;
  const inScope =
    active &&
    (activeCap?.scope === 'all' || activeCap?.scope === node.shard);
  const canUpdate = Boolean(inScope && activeCap?.rights.includes('update'));
  const canDelete = Boolean(inScope && activeCap?.rights.includes('delete'));
  const outgoingCount = arcs.filter((a) => a.source === node.id).length;
  const incomingCount = arcs.filter((a) => a.target === node.id).length;

  let guardLabel = 'Revoked';
  if (active) {
    if (!inScope) guardLabel = `Locked (${activeCap?.scope} only)`;
    else if (canUpdate && canDelete) guardLabel = 'Read/Write/Delete';
    else if (canUpdate) guardLabel = 'Read/Write';
    else guardLabel = 'Read-Only';
  }

  return {
    canUpdate,
    canDelete,
    outgoingCount,
    incomingCount,
    guardLabel,
  };
}

export function assignShardByConsistentHash(
  nodeId: string,
  healthyShards: Array<'Shard-A' | 'Shard-B' | 'Shard-C'>
): 'Shard-A' | 'Shard-B' | 'Shard-C' {
  const pool: Array<'Shard-A' | 'Shard-B' | 'Shard-C'> =
    healthyShards.length > 0 ? healthyShards : ['Shard-A'];
  const hash = hashString32(nodeId);
  return pool[hash % pool.length];
}

export function graphToMerkleRecords(
  nodes: GraphNode[],
  arcs: GraphArc[]
): Record<string, string> {
  const records: Record<string, string> = {};
  for (const n of nodes) {
    records[`node:${n.id}`] = `${n.label}|${n.shard}|${n.status}|${n.groupTag}`;
  }
  for (const a of arcs) {
    records[`arc:${a.id}`] = `${a.source}->${a.target}|${a.label}|w=${a.weight}|${a.status}`;
  }
  return records;
}

export function checkRightForToken(
  cap: CapabilityToken | undefined,
  allCaps: CapabilityToken[],
  right: CapabilityRight
): boolean {
  if (!cap) return false;
  return isCapabilityActive(cap.id, allCaps) && cap.rights.includes(right);
}
