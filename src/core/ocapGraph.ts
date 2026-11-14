export type CapabilityRight =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'batch'
  | 'delegate'
  | 'revoke';

export type CapabilityScope = 'all' | 'Shard-A' | 'Shard-B' | 'Shard-C';

export interface CapabilityToken {
  id: string;
  label: string;
  holder: string;
  rights: CapabilityRight[];
  scope: CapabilityScope;
  parentId: string | null;
  revoked: boolean;
}

export type GraphEntityStatus = 'active' | 'maintenance' | 'isolated';

export interface GraphNode {
  id: string;
  label: string;
  shard: 'Shard-A' | 'Shard-B' | 'Shard-C';
  status: GraphEntityStatus;
  groupTag: string;
  x: number;
  y: number;
}

export interface GraphArc {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
  status: GraphEntityStatus;
  groupTag: string;
}

export interface GraphQuery {
  text: string;
  shard: 'all' | 'Shard-A' | 'Shard-B' | 'Shard-C';
  status: 'all' | GraphEntityStatus;
  groupTag: string;
  minWeight: number | null;
  reachableFromNodeId: string;
}

export type BatchOperation =
  | {
      id: string;
      kind: 'update-nodes';
      nodeIds: string[];
      patch: Partial<Pick<GraphNode, 'label' | 'shard' | 'status' | 'groupTag'>>;
    }
  | {
      id: string;
      kind: 'delete-nodes';
      nodeIds: string[];
    }
  | {
      id: string;
      kind: 'update-arcs';
      arcIds: string[];
      patch: Partial<Pick<GraphArc, 'label' | 'weight' | 'status' | 'groupTag'>>;
    }
  | {
      id: string;
      kind: 'delete-arcs';
      arcIds: string[];
    }
  | {
      id: string;
      kind: 'create-node';
      node: GraphNode;
    }
  | {
      id: string;
      kind: 'create-arc';
      arc: GraphArc;
    };

export interface AuthCheckResult {
  allowed: boolean;
  reason: string;
}

export interface BatchExecutionResult {
  ok: boolean;
  nodes: GraphNode[];
  arcs: GraphArc[];
  appliedCount: number;
  summary: string;
  error?: string;
}

export function isCapabilityActive(
  capId: string,
  allCaps: CapabilityToken[],
  visited = new Set<string>()
): boolean {
  if (visited.has(capId)) return false;
  visited.add(capId);

  const cap = allCaps.find((c) => c.id === capId);
  if (!cap || cap.revoked) return false;
  if (!cap.parentId) return true;
  return isCapabilityActive(cap.parentId, allCaps, visited);
}

export function authorizeCapability(
  capId: string,
  allCaps: CapabilityToken[],
  requiredRight: CapabilityRight,
  targetShards: Array<'Shard-A' | 'Shard-B' | 'Shard-C'>
): AuthCheckResult {
  const cap = allCaps.find((c) => c.id === capId);
  if (!cap) {
    return { allowed: false, reason: `Capability Denied: unknown token "${capId}".` };
  }
  if (!isCapabilityActive(cap.id, allCaps)) {
    return {
      allowed: false,
      reason: `Capability Denied: token "${cap.label}" (${cap.id}) or its parent authority has been revoked.`,
    };
  }
  if (!cap.rights.includes(requiredRight)) {
    return {
      allowed: false,
      reason: `Capability Denied: "${cap.label}" lacks "${requiredRight}" authority.`,
    };
  }
  if (cap.scope !== 'all') {
    const outOfScope = targetShards.filter((s) => s !== cap.scope);
    if (outOfScope.length > 0) {
      return {
        allowed: false,
        reason: `Capability Denied: "${cap.label}" is confined to ${cap.scope} and cannot access ${Array.from(new Set(outOfScope)).join(', ')}.`,
      };
    }
  }
  return { allowed: true, reason: `Authorized via ${cap.label} (${cap.id}).` };
}

export function attenuateCapability(
  parentCapId: string,
  allCaps: CapabilityToken[],
  spec: {
    id: string;
    label: string;
    holder: string;
    rights: CapabilityRight[];
    scope: CapabilityScope;
  }
): { ok: true; token: CapabilityToken } | { ok: false; error: string } {
  const parent = allCaps.find((c) => c.id === parentCapId);
  if (!parent) {
    return { ok: false, error: 'Parent capability token not found.' };
  }
  if (!isCapabilityActive(parent.id, allCaps)) {
    return { ok: false, error: 'Cannot attenuate a revoked capability.' };
  }
  if (!parent.rights.includes('delegate')) {
    return {
      ok: false,
      error: `Capability Denied: "${parent.label}" does not hold "delegate" authority.`,
    };
  }

  // Enforce strict subset attenuation: cannot amplify rights or widen scope
  const validRights = spec.rights.filter((r) => parent.rights.includes(r));
  if (validRights.length === 0) {
    return {
      ok: false,
      error: 'Attenuated capability must retain at least one right held by its parent.',
    };
  }
  if (validRights.length !== spec.rights.length) {
    const disallowed = spec.rights.filter((r) => !parent.rights.includes(r));
    return {
      ok: false,
      error: `Cannot amplify rights beyond parent: [${disallowed.join(', ')}].`,
    };
  }

  if (parent.scope !== 'all' && spec.scope !== parent.scope) {
    return {
      ok: false,
      error: `Cannot widen scope to "${spec.scope}" when parent is confined to "${parent.scope}".`,
    };
  }

  return {
    ok: true,
    token: {
      id: spec.id,
      label: spec.label.trim(),
      holder: spec.holder.trim(),
      rights: Array.from(new Set(validRights)),
      scope: spec.scope,
      parentId: parent.id,
      revoked: false,
    },
  };
}

export function revokeCapability(
  allCaps: CapabilityToken[],
  targetCapId: string,
  actingCapId: string
): { ok: true; caps: CapabilityToken[] } | { ok: false; error: string } {
  const target = allCaps.find((c) => c.id === targetCapId);
  if (!target) {
    return { ok: false, error: `Capability "${targetCapId}" not found.` };
  }
  if (target.parentId === null && target.id === 'cap-root') {
    return { ok: false, error: 'Root authority token cannot be revoked.' };
  }

  const auth = authorizeCapability(actingCapId, allCaps, 'revoke', ['Shard-A']);
  if (!auth.allowed) {
    // Allow self-revocation or parent-holder revocation if actingCap has revoke
    return { ok: false, error: auth.reason };
  }

  return {
    ok: true,
    caps: allCaps.map((c) => (c.id === targetCapId ? { ...c, revoked: true } : c)),
  };
}

export function computeReachableNodeIds(
  startNodeId: string,
  arcs: GraphArc[]
): Set<string> {
  const visited = new Set<string>();
  if (!startNodeId) return visited;
  const queue: string[] = [startNodeId];
  visited.add(startNodeId);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const arc of arcs) {
      if (arc.source === curr && !visited.has(arc.target)) {
        visited.add(arc.target);
        queue.push(arc.target);
      }
    }
  }
  return visited;
}

export function queryGraph(
  nodes: GraphNode[],
  arcs: GraphArc[],
  query: GraphQuery
): { nodes: GraphNode[]; arcs: GraphArc[] } {
  const qText = query.text.trim().toLowerCase();
  const qGroup = query.groupTag.trim().toLowerCase();
  const reachable = query.reachableFromNodeId
    ? computeReachableNodeIds(query.reachableFromNodeId, arcs)
    : null;

  const matchedNodes = nodes.filter((n) => {
    if (query.shard !== 'all' && n.shard !== query.shard) return false;
    if (query.status !== 'all' && n.status !== query.status) return false;
    if (qGroup && !n.groupTag.toLowerCase().includes(qGroup)) return false;
    if (reachable && !reachable.has(n.id)) return false;
    if (
      qText &&
      !n.id.toLowerCase().includes(qText) &&
      !n.label.toLowerCase().includes(qText) &&
      !n.groupTag.toLowerCase().includes(qText)
    ) {
      return false;
    }
    return true;
  });

  const matchedNodeIds = new Set(matchedNodes.map((n) => n.id));

  const matchedArcs = arcs.filter((a) => {
    if (query.status !== 'all' && a.status !== query.status) return false;
    if (qGroup && !a.groupTag.toLowerCase().includes(qGroup)) return false;
    if (query.minWeight !== null && a.weight < query.minWeight) return false;
    if (reachable && (!reachable.has(a.source) || !reachable.has(a.target))) {
      return false;
    }
    if (query.shard !== 'all') {
      const src = nodes.find((n) => n.id === a.source);
      const tgt = nodes.find((n) => n.id === a.target);
      if (src?.shard !== query.shard && tgt?.shard !== query.shard) return false;
    }
    if (qText) {
      const textMatch =
        a.id.toLowerCase().includes(qText) ||
        a.label.toLowerCase().includes(qText) ||
        a.source.toLowerCase().includes(qText) ||
        a.target.toLowerCase().includes(qText) ||
        a.groupTag.toLowerCase().includes(qText);
      if (!textMatch && !matchedNodeIds.has(a.source) && !matchedNodeIds.has(a.target)) {
        return false;
      }
    }
    return true;
  });

  return { nodes: matchedNodes, arcs: matchedArcs };
}

function getArcShards(
  arc: GraphArc,
  nodes: GraphNode[]
): Array<'Shard-A' | 'Shard-B' | 'Shard-C'> {
  const shards: Array<'Shard-A' | 'Shard-B' | 'Shard-C'> = [];
  const src = nodes.find((n) => n.id === arc.source);
  const tgt = nodes.find((n) => n.id === arc.target);
  if (src) shards.push(src.shard);
  if (tgt) shards.push(tgt.shard);
  return shards.length > 0 ? shards : ['Shard-A'];
}

/**
 * Executes a batch of node/arc operations atomically under Object-Capability enforcement.
 * If any operation fails validation or lacks capability authority, no state is mutated.
 */
export function executeGraphBatch(
  initialNodes: GraphNode[],
  initialArcs: GraphArc[],
  operations: BatchOperation[],
  actingCapId: string,
  allCaps: CapabilityToken[]
): BatchExecutionResult {
  if (operations.length === 0) {
    return {
      ok: false,
      nodes: initialNodes,
      arcs: initialArcs,
      appliedCount: 0,
      summary: 'Batch empty.',
      error: 'Add at least one operation to the batch before executing.',
    };
  }

  // Require 'batch' right when executing multi-op batches (>1 op)
  if (operations.length > 1) {
    const batchAuth = authorizeCapability(actingCapId, allCaps, 'batch', []);
    if (!batchAuth.allowed) {
      return {
        ok: false,
        nodes: initialNodes,
        arcs: initialArcs,
        appliedCount: 0,
        summary: 'Batch aborted.',
        error: batchAuth.reason,
      };
    }
  }

  let nodes = [...initialNodes];
  let arcs = [...initialArcs];

  for (const op of operations) {
    if (op.kind === 'create-node') {
      const auth = authorizeCapability(actingCapId, allCaps, 'create', [op.node.shard]);
      if (!auth.allowed) {
        return {
          ok: false,
          nodes: initialNodes,
          arcs: initialArcs,
          appliedCount: 0,
          summary: 'Batch rolled back.',
          error: auth.reason,
        };
      }
      if (nodes.some((n) => n.id === op.node.id)) {
        return {
          ok: false,
          nodes: initialNodes,
          arcs: initialArcs,
          appliedCount: 0,
          summary: 'Batch rolled back.',
          error: `Node ID "${op.node.id}" already exists.`,
        };
      }
      nodes.push(op.node);
    } else if (op.kind === 'create-arc') {
      const srcExists = nodes.some((n) => n.id === op.arc.source);
      const tgtExists = nodes.some((n) => n.id === op.arc.target);
      if (!srcExists || !tgtExists) {
        return {
          ok: false,
          nodes: initialNodes,
          arcs: initialArcs,
          appliedCount: 0,
          summary: 'Batch rolled back.',
          error: `Arc endpoints "${op.arc.source}" -> "${op.arc.target}" must reference existing nodes.`,
        };
      }
      if (arcs.some((a) => a.id === op.arc.id)) {
        return {
          ok: false,
          nodes: initialNodes,
          arcs: initialArcs,
          appliedCount: 0,
          summary: 'Batch rolled back.',
          error: `Arc ID "${op.arc.id}" already exists.`,
        };
      }
      const shards = getArcShards(op.arc, nodes);
      const auth = authorizeCapability(actingCapId, allCaps, 'create', shards);
      if (!auth.allowed) {
        return {
          ok: false,
          nodes: initialNodes,
          arcs: initialArcs,
          appliedCount: 0,
          summary: 'Batch rolled back.',
          error: auth.reason,
        };
      }
      arcs.push(op.arc);
    } else if (op.kind === 'update-nodes') {
      const targets = nodes.filter((n) => op.nodeIds.includes(n.id));
      const shards = targets.map((n) => n.shard);
      if (op.patch.shard) shards.push(op.patch.shard);
      const auth = authorizeCapability(actingCapId, allCaps, 'update', shards);
      if (!auth.allowed) {
        return {
          ok: false,
          nodes: initialNodes,
          arcs: initialArcs,
          appliedCount: 0,
          summary: 'Batch rolled back.',
          error: auth.reason,
        };
      }
      const idSet = new Set(op.nodeIds);
      nodes = nodes.map((n) => (idSet.has(n.id) ? { ...n, ...op.patch } : n));
    } else if (op.kind === 'delete-nodes') {
      const targets = nodes.filter((n) => op.nodeIds.includes(n.id));
      const auth = authorizeCapability(
        actingCapId,
        allCaps,
        'delete',
        targets.map((n) => n.shard)
      );
      if (!auth.allowed) {
        return {
          ok: false,
          nodes: initialNodes,
          arcs: initialArcs,
          appliedCount: 0,
          summary: 'Batch rolled back.',
          error: auth.reason,
        };
      }
      const idSet = new Set(op.nodeIds);
      nodes = nodes.filter((n) => !idSet.has(n.id));
      arcs = arcs.filter((a) => !idSet.has(a.source) && !idSet.has(a.target));
    } else if (op.kind === 'update-arcs') {
      const targets = arcs.filter((a) => op.arcIds.includes(a.id));
      const shards = targets.flatMap((a) => getArcShards(a, nodes));
      const auth = authorizeCapability(actingCapId, allCaps, 'update', shards);
      if (!auth.allowed) {
        return {
          ok: false,
          nodes: initialNodes,
          arcs: initialArcs,
          appliedCount: 0,
          summary: 'Batch rolled back.',
          error: auth.reason,
        };
      }
      const idSet = new Set(op.arcIds);
      arcs = arcs.map((a) => (idSet.has(a.id) ? { ...a, ...op.patch } : a));
    } else if (op.kind === 'delete-arcs') {
      const targets = arcs.filter((a) => op.arcIds.includes(a.id));
      const shards = targets.flatMap((a) => getArcShards(a, nodes));
      const auth = authorizeCapability(actingCapId, allCaps, 'delete', shards);
      if (!auth.allowed) {
        return {
          ok: false,
          nodes: initialNodes,
          arcs: initialArcs,
          appliedCount: 0,
          summary: 'Batch rolled back.',
          error: auth.reason,
        };
      }
      const idSet = new Set(op.arcIds);
      arcs = arcs.filter((a) => !idSet.has(a.id));
    }
  }

  return {
    ok: true,
    nodes,
    arcs,
    appliedCount: operations.length,
    summary: `Executed ${operations.length} batched operation(s) cleanly under token ${actingCapId}.`,
  };
}

export function createSeedOcapGraphState(): {
  nodes: GraphNode[];
  arcs: GraphArc[];
  capabilities: CapabilityToken[];
  activeCapabilityId: string;
} {
  const nodes: GraphNode[] = [
    { id: 'N1', label: 'Ingress Router', shard: 'Shard-A', status: 'active', groupTag: 'edge', x: 90, y: 80 },
    { id: 'N2', label: 'Auth Verifier', shard: 'Shard-A', status: 'active', groupTag: 'edge', x: 250, y: 60 },
    { id: 'N3', label: 'Ledger Store', shard: 'Shard-B', status: 'active', groupTag: 'storage', x: 250, y: 200 },
    { id: 'N4', label: 'Replica Log', shard: 'Shard-B', status: 'active', groupTag: 'storage', x: 420, y: 120 },
    { id: 'N5', label: 'Audit Sink', shard: 'Shard-C', status: 'maintenance', groupTag: 'compliance', x: 420, y: 240 },
  ];

  const arcs: GraphArc[] = [
    { id: 'A1', source: 'N1', target: 'N2', label: 'verify-cap', weight: 4, status: 'active', groupTag: 'control' },
    { id: 'A2', source: 'N1', target: 'N3', label: 'write-tx', weight: 12, status: 'active', groupTag: 'data' },
    { id: 'A3', source: 'N2', target: 'N3', label: 'authorize', weight: 6, status: 'active', groupTag: 'control' },
    { id: 'A4', source: 'N3', target: 'N4', label: 'wal-sync', weight: 8, status: 'active', groupTag: 'replication' },
    { id: 'A5', source: 'N4', target: 'N5', label: 'archive', weight: 18, status: 'maintenance', groupTag: 'compliance' },
  ];

  const capabilities: CapabilityToken[] = [
    {
      id: 'cap-root',
      label: 'Root Authority',
      holder: 'Cluster Steward',
      rights: ['read', 'create', 'update', 'delete', 'batch', 'delegate', 'revoke'],
      scope: 'all',
      parentId: null,
      revoked: false,
    },
    {
      id: 'cap-shard-b',
      label: 'Shard-B Operator',
      holder: 'Storage Service',
      rights: ['read', 'create', 'update', 'batch', 'delegate'],
      scope: 'Shard-B',
      parentId: 'cap-root',
      revoked: false,
    },
    {
      id: 'cap-auditor',
      label: 'Read-Only Auditor',
      holder: 'Compliance Reader',
      rights: ['read'],
      scope: 'all',
      parentId: 'cap-root',
      revoked: false,
    },
  ];

  return {
    nodes,
    arcs,
    capabilities,
    activeCapabilityId: 'cap-root',
  };
}
