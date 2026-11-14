import {
  addOrSetItem,
  gossipConvergeAll,
  removeOrSetItem,
  setLwwRegister,
  type CrdtReplica,
} from './crdt';
import {
  buildVirtualRing,
  createKeyEntry,
  resolveKeyPlacement,
  type RingKeyEntry,
  type RingNode,
} from './hashRing';
import { getBucketIndex, syncDivergentBuckets } from './merkle';
import {
  attenuateCapability,
  executeGraphBatch,
  revokeCapability,
  updateCapabilityMetadata,
  type BatchOperation,
  type CapabilityRight,
  type CapabilityScope,
  type CapabilityToken,
  type GraphArc,
  type GraphEntityStatus,
  type GraphNode,
} from './ocapGraph';
import {
  executeQuorumRead,
  executeQuorumWrite,
  isStrongQuorum,
  type QuorumConfig,
  type QuorumNode,
} from './quorum';
import { assignShardByConsistentHash, graphToMerkleRecords } from './accessibilityOutput';

// Standard 6-dot Braille bitmask: dot1=1, dot2=2, dot3=4, dot4=8, dot5=16, dot6=32
const DOT_MAP_TO_CHAR: Record<string, string> = {
  '⠀': ' ',
  '⠁': 'a',
  '⠃': 'b',
  '⠉': 'c',
  '⠙': 'd',
  '⠑': 'e',
  '⠋': 'f',
  '⠛': 'g',
  '⠓': 'h',
  '⠊': 'i',
  '⠚': 'j',
  '⠅': 'k',
  '⠇': 'l',
  '⠍': 'm',
  '⠝': 'n',
  '⠕': 'o',
  '⠏': 'p',
  '⠟': 'q',
  '⠗': 'r',
  '⠎': 's',
  '⠞': 't',
  '⠥': 'u',
  '⠧': 'v',
  '⠺': 'w',
  '⠭': 'x',
  '⠽': 'y',
  '⠵': 'z',
  '⠲': '.',
  '⠂': ',',
  '⠒': ':',
  '⠆': ';',
  '⠤': '-',
  '⠌': '/',
  '⠳': '|',
  '⠜': '>',
  '⠣': '<',
  '⠶': '=',
  '⠦': '"',
};

const DIGIT_FROM_LETTER: Record<string, string> = {
  a: '1',
  b: '2',
  c: '3',
  d: '4',
  e: '5',
  f: '6',
  g: '7',
  h: '8',
  i: '9',
  j: '0',
};

export function dotsToBrailleCell(dots: number[]): {
  unicode: string;
  ascii: string;
  isNumberIndicator: boolean;
  isCapitalIndicator: boolean;
} {
  let mask = 0;
  for (const d of dots) {
    if (d >= 1 && d <= 6) {
      mask |= 1 << (d - 1);
    }
  }
  const unicode = String.fromCharCode(0x2800 + mask);
  if (unicode === '⠼') {
    return { unicode, ascii: '', isNumberIndicator: true, isCapitalIndicator: false };
  }
  if (unicode === '⠨') {
    return { unicode, ascii: '', isNumberIndicator: false, isCapitalIndicator: true };
  }
  return {
    unicode,
    ascii: DOT_MAP_TO_CHAR[unicode] ?? '',
    isNumberIndicator: false,
    isCapitalIndicator: false,
  };
}

export function containsUnicodeBraille(text: string): boolean {
  return /[\u2800-\u28FF]/.test(text);
}

/**
 * Decodes Grade-1 Unicode Braille patterns into ASCII command text.
 * Preserves any non-Braille characters intact so mixed input works smoothly.
 */
export function fromUnicodeBraille(text: string): string {
  let out = '';
  let numberMode = false;
  let capNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '⠼') {
      numberMode = true;
      continue;
    }
    if (ch === '⠨') {
      capNext = true;
      continue;
    }
    if (ch === '⠐') {
      // Handle 2-cell punctuation prefixes if present
      const next = text[i + 1];
      if (next === '⠣') {
        out += '(';
        i++;
        continue;
      }
      if (next === '⠜') {
        out += ')';
        i++;
        continue;
      }
      continue;
    }

    if (ch in DOT_MAP_TO_CHAR) {
      const mapped = DOT_MAP_TO_CHAR[ch];
      if (mapped === ' ') {
        numberMode = false;
        capNext = false;
        out += ' ';
        continue;
      }
      if (numberMode && mapped in DIGIT_FROM_LETTER) {
        out += DIGIT_FROM_LETTER[mapped];
        continue;
      }
      numberMode = false;
      if (capNext) {
        out += mapped.toUpperCase();
        capNext = false;
      } else {
        out += mapped;
      }
    } else {
      numberMode = false;
      capNext = false;
      out += ch;
    }
  }
  return out;
}

export function tokenizeAccessibleCommand(rawInput: string): string[] {
  const decoded = containsUnicodeBraille(rawInput)
    ? fromUnicodeBraille(rawInput)
    : rawInput;
  const tokens: string[] = [];
  let current = '';
  let inQuote: '"' | "'" | null = null;

  for (let i = 0; i < decoded.length; i++) {
    const ch = decoded[i];
    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

export function normalizeShardToken(
  raw: string
): 'Shard-A' | 'Shard-B' | 'Shard-C' | null {
  const clean = raw.trim().toLowerCase();
  if (clean === 'shard-a' || clean === 'zone-a' || clean === 'a') return 'Shard-A';
  if (clean === 'shard-b' || clean === 'zone-b' || clean === 'b') return 'Shard-B';
  if (clean === 'shard-c' || clean === 'zone-c' || clean === 'c') return 'Shard-C';
  return null;
}

function normalizeStatusToken(raw: string): GraphEntityStatus | null {
  const clean = raw.trim().toLowerCase();
  if (clean === 'active' || clean === 'maintenance' || clean === 'isolated') {
    return clean;
  }
  return null;
}

export interface AccessibleClusterState {
  graphNodes: GraphNode[];
  graphArcs: GraphArc[];
  selectedNodeIds: string[];
  selectedArcIds: string[];
  capabilities: CapabilityToken[];
  activeCapabilityId: string;
  ringNodes: RingNode[];
  ringEntries: RingKeyEntry[];
  replicationFactor: number;
  crdtReplicas: CrdtReplica[];
  merkleReplicaB: Record<string, string>;
  quorumConfig: QuorumConfig;
  quorumNodes: QuorumNode[];
  quorumVersion: number;
}

export interface AccessibleCommandOutcome {
  ok: boolean;
  severity: 'info' | 'warning' | 'success';
  summary: string;
  nextState: AccessibleClusterState;
  decodedCommand: string;
}

const VALID_RIGHTS: CapabilityRight[] = [
  'read',
  'create',
  'update',
  'delete',
  'batch',
  'delegate',
  'revoke',
];

function resolveExistingNodeId(id: string, nodes: GraphNode[], extraNodeIds: string[] = []): string {
  const match = nodes.find((n) => n.id.toLowerCase() === id.toLowerCase());
  if (match) return match.id;
  const extra = extraNodeIds.find((e) => e.toLowerCase() === id.toLowerCase());
  return extra ?? id;
}

function resolveExistingArcId(id: string, arcs: GraphArc[]): string {
  const match = arcs.find((a) => a.id.toLowerCase() === id.toLowerCase());
  return match ? match.id : id;
}

function parseSingleGraphOp(
  clause: string,
  state: AccessibleClusterState,
  pendingCreatedNodeIds: string[] = []
): { op?: BatchOperation; selectionPatch?: { nodeIds?: string[]; arcIds?: string[] }; error?: string } {
  let tokens = tokenizeAccessibleCommand(clause);
  if (tokens.length === 0) return { error: 'Empty command clause.' };

  // Support ASL Topic-Comment syntax by normalizing:
  // e.g. "NODE N6 CREATE ..." -> "create node N6 ..."
  //      "ARC A6 N1->N3 CREATE ..." -> "create arc A6 N1->N3 ..."
  //      "NODES N1,N2 UPDATE ..." -> "update nodes N1,N2 ..."
  const t0 = tokens[0].toLowerCase();
  if ((t0 === 'node' || t0 === 'nodes' || t0 === 'arc' || t0 === 'arcs') && tokens.length >= 3) {
    const verbIdx = tokens.findIndex((t, idx) =>
      idx > 0 && ['create', 'add', 'update', 'edit', 'delete', 'remove', 'select'].includes(t.toLowerCase())
    );
    if (verbIdx > 0) {
      const verb = tokens[verbIdx];
      const rest = tokens.filter((_, idx) => idx !== 0 && idx !== verbIdx);
      tokens = [verb, t0, ...rest];
    }
  }

  const verb = tokens[0].toLowerCase();
  const target = (tokens[1] ?? '').toLowerCase();
  const args = tokens.slice(2);

  if ((verb === 'create' || verb === 'add') && target === 'node') {
    const id = args[0];
    const label = args[1] ?? id;
    if (!id) return { error: 'Usage: create node <id> [label] [Shard-A|Shard-B|Shard-C] [tag]' };

    let shard: 'Shard-A' | 'Shard-B' | 'Shard-C' = assignShardByConsistentHash(
      id,
      ['Shard-A', 'Shard-B', 'Shard-C']
    );
    let groupTag = 'general';

    for (const arg of args.slice(2)) {
      const maybeShard = normalizeShardToken(arg);
      if (maybeShard) {
        shard = maybeShard;
      } else if (arg.startsWith('shard=')) {
        const s = normalizeShardToken(arg.slice(6));
        if (s) shard = s;
      } else if (arg.startsWith('tag=')) {
        groupTag = arg.slice(4) || groupTag;
      } else {
        groupTag = arg;
      }
    }

    return {
      op: {
        id: `cmd-cn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        kind: 'create-node',
        node: {
          id,
          label,
          shard,
          status: 'active',
          groupTag,
          x: 200,
          y: 160,
        },
      },
    };
  }

  if ((verb === 'create' || verb === 'add') && target === 'arc') {
    const id = args[0];
    const edge = args[1] ?? '';
    const arrowParts = edge.split(/->|→/);
    if (!id || arrowParts.length !== 2 || !arrowParts[0] || !arrowParts[1]) {
      return {
        error: 'Usage: create arc <id> <src>-><tgt> [label] [w=<weight>] [tag=<group>]',
      };
    }
    let label = 'link';
    let weight = 10;
    let groupTag = 'data';
    for (const arg of args.slice(2)) {
      if (arg.startsWith('w=')) {
        const w = Number(arg.slice(2));
        if (Number.isFinite(w) && w >= 0) weight = w;
      } else if (arg.startsWith('weight=')) {
        const w = Number(arg.slice(7));
        if (Number.isFinite(w) && w >= 0) weight = w;
      } else if (arg.startsWith('tag=')) {
        groupTag = arg.slice(4) || groupTag;
      } else if (label === 'link') {
        label = arg;
      } else {
        groupTag = arg;
      }
    }

    return {
      op: {
        id: `cmd-ca-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        kind: 'create-arc',
        arc: {
          id,
          source: resolveExistingNodeId(arrowParts[0], state.graphNodes, pendingCreatedNodeIds),
          target: resolveExistingNodeId(arrowParts[1], state.graphNodes, pendingCreatedNodeIds),
          label,
          weight,
          status: 'active',
          groupTag,
        },
      },
    };
  }

  if ((verb === 'update' || verb === 'edit') && (target === 'node' || target === 'nodes')) {
    const idCsv = args[0];
    if (!idCsv) {
      return {
        error: 'Usage: update node <id[,id2]> [label=...] [shard=...] [status=...] [tag=...]',
      };
    }
    const nodeIds = idCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((id) => resolveExistingNodeId(id, state.graphNodes, pendingCreatedNodeIds));
    const patch: Partial<Pick<GraphNode, 'label' | 'shard' | 'status' | 'groupTag'>> = {};
    for (const arg of args.slice(1)) {
      if (arg.startsWith('label=')) patch.label = arg.slice(6);
      else if (arg.startsWith('shard=')) {
        const s = normalizeShardToken(arg.slice(6));
        if (!s) return { error: `Unknown shard "${arg.slice(6)}".` };
        patch.shard = s;
      } else if (arg.startsWith('status=')) {
        const st = normalizeStatusToken(arg.slice(7));
        if (!st) return { error: `Unknown status "${arg.slice(7)}".` };
        patch.status = st;
      } else if (arg.startsWith('tag=')) patch.groupTag = arg.slice(4);
      else {
        const maybeShard = normalizeShardToken(arg);
        const maybeStatus = normalizeStatusToken(arg);
        if (maybeShard) patch.shard = maybeShard;
        else if (maybeStatus) patch.status = maybeStatus;
      }
    }
    if (Object.keys(patch).length === 0) {
      return { error: 'Specify at least one field to update (label=, shard=, status=, tag=).' };
    }
    return {
      op: {
        id: `cmd-un-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        kind: 'update-nodes',
        nodeIds,
        patch,
      },
    };
  }

  if ((verb === 'update' || verb === 'edit') && (target === 'arc' || target === 'arcs')) {
    const idCsv = args[0];
    if (!idCsv) {
      return {
        error: 'Usage: update arc <id[,id2]> [label=] [weight=] [status=] [source=] [target=]',
      };
    }
    const arcIds = idCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((id) => resolveExistingArcId(id, state.graphArcs));
    const patch: Partial<
      Pick<GraphArc, 'label' | 'weight' | 'status' | 'groupTag' | 'source' | 'target'>
    > = {};
    for (const arg of args.slice(1)) {
      if (arg.startsWith('label=')) patch.label = arg.slice(6);
      else if (arg.startsWith('source=')) {
        patch.source = resolveExistingNodeId(
          arg.slice(7),
          state.graphNodes,
          pendingCreatedNodeIds
        );
      } else if (arg.startsWith('target=')) {
        patch.target = resolveExistingNodeId(
          arg.slice(7),
          state.graphNodes,
          pendingCreatedNodeIds
        );
      } else if (arg.startsWith('tag=')) patch.groupTag = arg.slice(4);
      else if (arg.startsWith('w=') || arg.startsWith('weight=')) {
        const val = Number(arg.split('=')[1]);
        if (!Number.isFinite(val) || val < 0) return { error: 'Arc weight must be >= 0.' };
        patch.weight = val;
      } else if (arg.startsWith('status=')) {
        const st = normalizeStatusToken(arg.slice(7));
        if (!st) return { error: `Unknown status "${arg.slice(7)}".` };
        patch.status = st;
      } else {
        const maybeStatus = normalizeStatusToken(arg);
        if (maybeStatus) patch.status = maybeStatus;
      }
    }
    if (Object.keys(patch).length === 0) {
      return { error: 'Specify at least one arc field to update.' };
    }
    return {
      op: {
        id: `cmd-ua-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        kind: 'update-arcs',
        arcIds,
        patch,
      },
    };
  }

  if ((verb === 'delete' || verb === 'remove') && (target === 'node' || target === 'nodes')) {
    const idCsv = args[0];
    if (!idCsv) return { error: 'Usage: delete node <id[,id2]>' };
    return {
      op: {
        id: `cmd-dn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        kind: 'delete-nodes',
        nodeIds: idCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((id) => resolveExistingNodeId(id, state.graphNodes, pendingCreatedNodeIds)),
      },
    };
  }

  if ((verb === 'delete' || verb === 'remove') && (target === 'arc' || target === 'arcs')) {
    const idCsv = args[0];
    if (!idCsv) return { error: 'Usage: delete arc <id[,id2]>' };
    return {
      op: {
        id: `cmd-da-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        kind: 'delete-arcs',
        arcIds: idCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((id) => resolveExistingArcId(id, state.graphArcs)),
      },
    };
  }

  if (verb === 'select' && (target === 'node' || target === 'nodes')) {
    const ids = (args[0] ?? '')
      .split(',')
      .map((s) => resolveExistingNodeId(s.trim(), state.graphNodes, pendingCreatedNodeIds))
      .filter((id) => state.graphNodes.some((n) => n.id === id));
    return { selectionPatch: { nodeIds: ids } };
  }

  if (verb === 'select' && (target === 'arc' || target === 'arcs')) {
    const ids = (args[0] ?? '')
      .split(',')
      .map((s) => resolveExistingArcId(s.trim(), state.graphArcs))
      .filter((id) => state.graphArcs.some((a) => a.id === id));
    return { selectionPatch: { arcIds: ids } };
  }

  return { error: `Unrecognized graph edit clause: "${clause}".` };
}

/**
 * Executes an accessible edit command (plain text, Unicode Braille, or ASL-order gloss)
 * against the distributed graph, data structures, or object-capabilities.
 */
export function executeAccessibleCommand(
  rawInput: string,
  state: AccessibleClusterState
): AccessibleCommandOutcome {
  const decodedCommand = (
    containsUnicodeBraille(rawInput) ? fromUnicodeBraille(rawInput) : rawInput
  ).trim();

  if (!decodedCommand) {
    return {
      ok: false,
      severity: 'warning',
      summary: 'Enter an edit command or Braille chord sequence before running.',
      nextState: state,
      decodedCommand,
    };
  }

  // Strip optional "batch" prefix if user writes "batch add node ... | add arc ..."
  const normalizedCommand = decodedCommand.replace(/^batch\s+/i, '');
  const clauses = normalizedCommand
    .split(/[;|]/)
    .map((c) => c.trim())
    .filter(Boolean);

  // Single-clause non-graph data-structure or capability commands
  if (clauses.length === 1) {
    let tokens = tokenizeAccessibleCommand(clauses[0]);
    const head = (tokens[0] ?? '').toLowerCase();

    // Normalize ASL topic-first capability order: "CAPABILITY USE cap-root" / "CAPABILITY REVOKE cap-shard-b"
    if (head === 'capability' || head === 'cap') {
      const sub = (tokens[1] ?? '').toLowerCase();
      if (sub === 'use' && tokens[2]) {
        const found = state.capabilities.find(
          (c) => c.id.toLowerCase() === tokens[2].toLowerCase()
        );
        if (!found) {
          return {
            ok: false,
            severity: 'warning',
            summary: `Capability token "${tokens[2]}" not found.`,
            nextState: state,
            decodedCommand,
          };
        }
        return {
          ok: true,
          severity: 'success',
          summary: `Active capability switched to ${found.label} (${found.id}, scope: ${found.scope}).`,
          nextState: { ...state, activeCapabilityId: found.id },
          decodedCommand,
        };
      }

      if (sub === 'mint' && tokens.length >= 6) {
        const [, , label, holder, scopeRaw, rightsCsv] = tokens;
        const scope: CapabilityScope | null =
          scopeRaw.toLowerCase() === 'all' ? 'all' : normalizeShardToken(scopeRaw);
        if (!scope) {
          return {
            ok: false,
            severity: 'warning',
            summary: `Invalid capability scope "${scopeRaw}". Use all, Shard-A, Shard-B, or Shard-C.`,
            nextState: state,
            decodedCommand,
          };
        }
        const parsedRights = rightsCsv
          .split(',')
          .map((r) => r.trim().toLowerCase() as CapabilityRight)
          .filter((r) => VALID_RIGHTS.includes(r));
        const newId = `cap-${Date.now().toString(36).slice(-4)}`;
        const res = attenuateCapability(state.activeCapabilityId, state.capabilities, {
          id: newId,
          label,
          holder,
          scope,
          rights: parsedRights,
        });
        if (!res.ok) {
          return {
            ok: false,
            severity: 'warning',
            summary: res.error,
            nextState: state,
            decodedCommand,
          };
        }
        return {
          ok: true,
          severity: 'success',
          summary: `Minted attenuated capability "${res.token.label}" (${res.token.id}) scoped to ${res.token.scope}.`,
          nextState: {
            ...state,
            capabilities: [...state.capabilities, res.token],
          },
          decodedCommand,
        };
      }

      if ((sub === 'edit' || sub === 'update') && tokens[2]) {
        const targetId = tokens[2];
        const patch: { label?: string; holder?: string } = {};
        for (const arg of tokens.slice(3)) {
          if (arg.startsWith('label=')) patch.label = arg.slice(6);
          else if (arg.startsWith('holder=')) patch.holder = arg.slice(7);
        }
        const res = updateCapabilityMetadata(
          state.capabilities,
          targetId,
          state.activeCapabilityId,
          patch
        );
        if (!res.ok) {
          return {
            ok: false,
            severity: 'warning',
            summary: res.error,
            nextState: state,
            decodedCommand,
          };
        }
        return {
          ok: true,
          severity: 'success',
          summary: `Updated capability "${targetId}" metadata under non-amplifying OCap guardrails.`,
          nextState: { ...state, capabilities: res.caps },
          decodedCommand,
        };
      }

      if (sub === 'revoke' && tokens[2]) {
        const res = revokeCapability(
          state.capabilities,
          tokens[2],
          state.activeCapabilityId
        );
        if (!res.ok) {
          return {
            ok: false,
            severity: 'warning',
            summary: res.error,
            nextState: state,
            decodedCommand,
          };
        }
        return {
          ok: true,
          severity: 'warning',
          summary: `Revoked capability ${tokens[2]} and invalidated any attenuated descendant tokens.`,
          nextState: { ...state, capabilities: res.caps },
          decodedCommand,
        };
      }

      return {
        ok: false,
        severity: 'warning',
        summary:
          'Capability commands: cap use <id> | cap mint <label> <holder> <scope> <rights_csv> | cap edit <id> label=... holder=... | cap revoke <id>',
        nextState: state,
        decodedCommand,
      };
    }

    // CRDT commands
    if (head === 'crdt') {
      const sub = (tokens[1] ?? '').toLowerCase();
      if (sub === 'sync') {
        const healed = state.crdtReplicas.map((r) => ({ ...r, partitioned: false }));
        const synced = gossipConvergeAll(healed);
        return {
          ok: true,
          severity: 'success',
          summary: 'Healed partitions and converged all CRDT graph replicas.',
          nextState: { ...state, crdtReplicas: synced },
          decodedCommand,
        };
      }
      if (sub === 'add' && tokens[2] && tokens[3]) {
        const repId = tokens[2].toUpperCase();
        if (!state.crdtReplicas.some((r) => r.id === repId)) {
          return {
            ok: false,
            severity: 'warning',
            summary: `Unknown CRDT replica "${tokens[2]}".`,
            nextState: state,
            decodedCommand,
          };
        }
        const updated = state.crdtReplicas.map((r) =>
          r.id === repId ? addOrSetItem(r, tokens[3], Date.now() % 10000) : r
        );
        return {
          ok: true,
          severity: 'success',
          summary: `Added OR-Set entry "${tokens[3]}" on ${repId}.`,
          nextState: { ...state, crdtReplicas: updated },
          decodedCommand,
        };
      }
      if (sub === 'remove' && tokens[2] && tokens[3]) {
        const repId = tokens[2].toUpperCase();
        const updated = state.crdtReplicas.map((r) =>
          r.id === repId ? removeOrSetItem(r, tokens[3]) : r
        );
        return {
          ok: true,
          severity: 'info',
          summary: `Removed OR-Set entry "${tokens[3]}" on ${repId}.`,
          nextState: { ...state, crdtReplicas: updated },
          decodedCommand,
        };
      }
      if (sub === 'set' && tokens[2] && tokens[3] && tokens[4]) {
        const repId = tokens[2].toUpperCase();
        const updated = state.crdtReplicas.map((r) =>
          r.id === repId ? setLwwRegister(r, tokens[3], tokens[4]) : r
        );
        return {
          ok: true,
          severity: 'success',
          summary: `Updated LWW register "${tokens[3]}" = "${tokens[4]}" on ${repId}.`,
          nextState: { ...state, crdtReplicas: updated },
          decodedCommand,
        };
      }
      if ((sub === 'partition' || sub === 'reconnect') && tokens[2]) {
        const repId = tokens[2].toUpperCase();
        const partitioned = sub === 'partition';
        const updated = state.crdtReplicas.map((r) =>
          r.id === repId ? { ...r, partitioned } : r
        );
        return {
          ok: true,
          severity: partitioned ? 'warning' : 'info',
          summary: `${repId} ${partitioned ? 'partitioned from' : 'reconnected to'} gossip sync.`,
          nextState: { ...state, crdtReplicas: updated },
          decodedCommand,
        };
      }
    }

    // Ring commands
    if (head === 'ring') {
      const sub = (tokens[1] ?? '').toLowerCase();
      if (sub === 'put' && tokens[2] && tokens[3]) {
        const nextEntry = createKeyEntry(tokens[2], tokens[3]);
        const exists = state.ringEntries.some((e) => e.key === tokens[2]);
        const updated = exists
          ? state.ringEntries.map((e) => (e.key === tokens[2] ? nextEntry : e))
          : [nextEntry, ...state.ringEntries];
        const vnodes = buildVirtualRing(state.ringNodes);
        const placement = resolveKeyPlacement(nextEntry, vnodes, state.replicationFactor);
        return {
          ok: true,
          severity: 'success',
          summary: `${exists ? 'Updated' : 'Inserted'} ring key "${tokens[2]}" on primary ${placement.primaryNodeId ?? 'none'}.`,
          nextState: { ...state, ringEntries: updated },
          decodedCommand,
        };
      }
      if (sub === 'delete' && tokens[2]) {
        return {
          ok: true,
          severity: 'info',
          summary: `Removed ring key "${tokens[2]}".`,
          nextState: {
            ...state,
            ringEntries: state.ringEntries.filter((e) => e.key !== tokens[2]),
          },
          decodedCommand,
        };
      }
      if ((sub === 'fail' || sub === 'recover') && tokens[2]) {
        const nextStatus: 'healthy' | 'offline' =
          sub === 'fail' ? 'offline' : 'healthy';
        const updated = state.ringNodes.map((n) =>
          n.id.toLowerCase() === tokens[2].toLowerCase()
            ? { ...n, status: nextStatus }
            : n
        );
        return {
          ok: true,
          severity: nextStatus === 'offline' ? 'warning' : 'success',
          summary: `Ring node ${tokens[2]} marked ${nextStatus}.`,
          nextState: { ...state, ringNodes: updated },
          decodedCommand,
        };
      }
      if (sub === 'rf' && tokens[2]) {
        const rf = Math.min(3, Math.max(1, Number(tokens[2]) || 2));
        return {
          ok: true,
          severity: 'info',
          summary: `Updated hash ring replication factor to N=${rf}.`,
          nextState: { ...state, replicationFactor: rf },
          decodedCommand,
        };
      }
    }

    // Quorum commands
    if (head === 'quorum') {
      const sub = (tokens[1] ?? '').toLowerCase();
      if (sub === 'set') {
        let w = state.quorumConfig.w;
        let r = state.quorumConfig.r;
        for (const arg of tokens.slice(2)) {
          if (arg.startsWith('w=')) w = Math.min(state.quorumConfig.n, Math.max(1, Number(arg.slice(2)) || w));
          if (arg.startsWith('r=')) r = Math.min(state.quorumConfig.n, Math.max(1, Number(arg.slice(2)) || r));
        }
        const nextConfig = { ...state.quorumConfig, w, r };
        const strong = isStrongQuorum(nextConfig);
        return {
          ok: true,
          severity: strong ? 'success' : 'warning',
          summary: `Quorum updated to W=${w}, R=${r} (${strong ? 'Strong quorum' : 'Stale reads possible'}).`,
          nextState: { ...state, quorumConfig: nextConfig },
          decodedCommand,
        };
      }
      if (sub === 'write' && tokens[2]) {
        const res = executeQuorumWrite(
          state.quorumNodes,
          state.quorumConfig,
          tokens[2],
          state.quorumVersion,
          0
        );
        return {
          ok: res.success,
          severity: res.success ? 'success' : 'warning',
          summary: res.message,
          nextState: {
            ...state,
            quorumNodes: res.nodes,
            quorumVersion: res.writtenVersion,
          },
          decodedCommand,
        };
      }
      if (sub === 'read') {
        const res = executeQuorumRead(
          state.quorumNodes,
          state.quorumConfig,
          state.quorumVersion,
          true,
          2
        );
        return {
          ok: res.success,
          severity: !res.success || res.isStaleRead ? 'warning' : 'success',
          summary: res.message,
          nextState: res.success ? { ...state, quorumNodes: res.nodes } : state,
          decodedCommand,
        };
      }
      if (sub === 'toggle' && tokens[2]) {
        const updated = state.quorumNodes.map((n) =>
          n.id.toLowerCase() === tokens[2].toLowerCase()
            ? { ...n, reachable: !n.reachable }
            : n
        );
        return {
          ok: true,
          severity: 'info',
          summary: `Toggled network reachability for quorum replica ${tokens[2]}.`,
          nextState: { ...state, quorumNodes: updated },
          decodedCommand,
        };
      }
    }

    // Merkle commands
    if (head === 'merkle') {
      const sub = (tokens[1] ?? '').toLowerCase();
      if (sub === 'drift' && tokens[2] && tokens[3]) {
        const updatedB = { ...state.merkleReplicaB, [tokens[2]]: tokens[3] };
        const bIdx = getBucketIndex(tokens[2]);
        return {
          ok: true,
          severity: 'warning',
          summary: `Injected drift on "${tokens[2]}" at Replica B (Bucket ${bIdx}).`,
          nextState: { ...state, merkleReplicaB: updatedB },
          decodedCommand,
        };
      }
      if (sub === 'repair') {
        const live = graphToMerkleRecords(state.graphNodes, state.graphArcs);
        const repaired = syncDivergentBuckets(live, state.merkleReplicaB, [
          0, 1, 2, 3, 4, 5, 6, 7,
        ]);
        return {
          ok: true,
          severity: 'success',
          summary: 'Repaired all divergent Merkle buckets from live distributed graph.',
          nextState: { ...state, merkleReplicaB: repaired },
          decodedCommand,
        };
      }
    }
  }

  // Graph Batch / Single Graph Ops
  const ops: BatchOperation[] = [];
  const pendingCreatedNodeIds: string[] = [];
  let nextSelectedNodes = state.selectedNodeIds;
  let nextSelectedArcs = state.selectedArcIds;

  for (const clause of clauses) {
    const parsed = parseSingleGraphOp(clause, state, pendingCreatedNodeIds);
    if (parsed.error) {
      return {
        ok: false,
        severity: 'warning',
        summary: parsed.error,
        nextState: state,
        decodedCommand,
      };
    }
    if (parsed.selectionPatch?.nodeIds) nextSelectedNodes = parsed.selectionPatch.nodeIds;
    if (parsed.selectionPatch?.arcIds) nextSelectedArcs = parsed.selectionPatch.arcIds;
    if (parsed.op) {
      ops.push(parsed.op);
      if (parsed.op.kind === 'create-node') {
        pendingCreatedNodeIds.push(parsed.op.node.id);
      }
    }
  }

  if (ops.length === 0) {
    return {
      ok: true,
      severity: 'info',
      summary: `Updated selection group (${nextSelectedNodes.length} nodes, ${nextSelectedArcs.length} arcs).`,
      nextState: {
        ...state,
        selectedNodeIds: nextSelectedNodes,
        selectedArcIds: nextSelectedArcs,
      },
      decodedCommand,
    };
  }

  const batchResult = executeGraphBatch(
    state.graphNodes,
    state.graphArcs,
    ops,
    state.activeCapabilityId,
    state.capabilities
  );
  if (!batchResult.ok) {
    return {
      ok: false,
      severity: 'warning',
      summary: batchResult.error ?? 'Graph batch aborted.',
      nextState: state,
      decodedCommand,
    };
  }

  const existingNodeIds = new Set(batchResult.nodes.map((n) => n.id));
  const existingArcIds = new Set(batchResult.arcs.map((a) => a.id));

  return {
    ok: true,
    severity: 'success',
    summary: batchResult.summary,
    nextState: {
      ...state,
      graphNodes: batchResult.nodes,
      graphArcs: batchResult.arcs,
      selectedNodeIds: nextSelectedNodes.filter((id) => existingNodeIds.has(id)),
      selectedArcIds: nextSelectedArcs.filter((id) => existingArcIds.has(id)),
    },
    decodedCommand,
  };
}
