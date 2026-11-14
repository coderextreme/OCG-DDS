export type NodeStatus = 'healthy' | 'offline';

export interface RingNode {
  id: string;
  label: string;
  zone: string;
  status: NodeStatus;
  vnodes: number;
}

export interface VirtualNode {
  vnodeId: string;
  nodeId: string;
  hash: number;
  angleDeg: number;
}

export interface RingKeyEntry {
  key: string;
  value: string;
  hash: number;
  angleDeg: number;
}

export interface KeyPlacement {
  entry: RingKeyEntry;
  primaryNodeId: string | null;
  replicaNodeIds: string[];
  allAssignedNodeIds: string[];
}

export interface RingMetrics {
  healthyNodeCount: number;
  totalVnodes: number;
  totalKeys: number;
  keyBalanceStdDev: number;
  maxLoadSharePercent: number;
}

const UINT32_MAX = 0xffffffff;

/**
 * Deterministic 32-bit FNV-1a hash with avalanche mixing for even ring spread.
 */
export function hashString32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Murmur3-style finalizer avalanche so sequential keys (k1, k2, k3) spread widely
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

export function hashToHex(hash: number): string {
  return '0x' + (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export function hashToAngleDeg(hash: number): number {
  return ((hash >>> 0) / UINT32_MAX) * 360;
}

export function buildVirtualRing(nodes: RingNode[]): VirtualNode[] {
  const vnodes: VirtualNode[] = [];
  for (const node of nodes) {
    if (node.status !== 'healthy') continue;
    const count = Math.max(1, Math.min(32, node.vnodes));
    for (let i = 0; i < count; i++) {
      const vnodeId = `${node.id}#vn${i}`;
      const hash = hashString32(vnodeId);
      vnodes.push({
        vnodeId,
        nodeId: node.id,
        hash,
        angleDeg: hashToAngleDeg(hash),
      });
    }
  }
  vnodes.sort((a, b) => a.hash - b.hash);
  return vnodes;
}

/**
 * Finds the preference list of up to `replicationFactor` distinct physical nodes
 * clockwise from the key's hash on the virtual ring.
 */
export function resolveKeyPlacement(
  entry: RingKeyEntry,
  sortedVnodes: VirtualNode[],
  replicationFactor: number
): KeyPlacement {
  if (sortedVnodes.length === 0) {
    return {
      entry,
      primaryNodeId: null,
      replicaNodeIds: [],
      allAssignedNodeIds: [],
    };
  }

  // Binary search for first vnode with hash >= entry.hash
  let lo = 0;
  let hi = sortedVnodes.length - 1;
  let startIndex = 0;
  if (entry.hash <= sortedVnodes[hi].hash) {
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (sortedVnodes[mid].hash >= entry.hash) {
        startIndex = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
  } else {
    startIndex = 0; // wrap around ring
  }

  const assigned: string[] = [];
  const seen = new Set<string>();
  const targetCount = Math.max(1, replicationFactor);

  for (let offset = 0; offset < sortedVnodes.length; offset++) {
    const idx = (startIndex + offset) % sortedVnodes.length;
    const physId = sortedVnodes[idx].nodeId;
    if (!seen.has(physId)) {
      seen.add(physId);
      assigned.push(physId);
      if (assigned.length >= targetCount) break;
    }
  }

  return {
    entry,
    primaryNodeId: assigned[0] ?? null,
    replicaNodeIds: assigned.slice(1),
    allAssignedNodeIds: assigned,
  };
}

export function createKeyEntry(key: string, value: string): RingKeyEntry {
  const hash = hashString32(key);
  return {
    key,
    value,
    hash,
    angleDeg: hashToAngleDeg(hash),
  };
}

export function computeRingMetrics(
  nodes: RingNode[],
  placements: KeyPlacement[],
  sortedVnodes: VirtualNode[]
): RingMetrics {
  const healthyNodes = nodes.filter((n) => n.status === 'healthy');
  const primaryCounts = new Map<string, number>();
  for (const n of healthyNodes) {
    primaryCounts.set(n.id, 0);
  }
  for (const p of placements) {
    if (p.primaryNodeId && primaryCounts.has(p.primaryNodeId)) {
      primaryCounts.set(p.primaryNodeId, (primaryCounts.get(p.primaryNodeId) ?? 0) + 1);
    }
  }

  const counts = Array.from(primaryCounts.values());
  const totalKeys = placements.length;
  let stdDev = 0;
  let maxShare = 0;

  if (counts.length > 0 && totalKeys > 0) {
    const mean = totalKeys / counts.length;
    const variance =
      counts.reduce((acc, c) => acc + Math.pow(c - mean, 2), 0) / counts.length;
    stdDev = Math.sqrt(variance);
    const maxCount = Math.max(...counts);
    maxShare = (maxCount / totalKeys) * 100;
  }

  return {
    healthyNodeCount: healthyNodes.length,
    totalVnodes: sortedVnodes.length,
    totalKeys,
    keyBalanceStdDev: Number(stdDev.toFixed(2)),
    maxLoadSharePercent: Number(maxShare.toFixed(1)),
  };
}

export function createSeedRingState(): {
  nodes: RingNode[];
  entries: RingKeyEntry[];
  replicationFactor: number;
} {
  const nodes: RingNode[] = [
    { id: 'Node-A', label: 'Node A (us-east)', zone: 'Zone 1', status: 'healthy', vnodes: 8 },
    { id: 'Node-B', label: 'Node B (us-west)', zone: 'Zone 2', status: 'healthy', vnodes: 8 },
    { id: 'Node-C', label: 'Node C (eu-central)', zone: 'Zone 3', status: 'healthy', vnodes: 8 },
    { id: 'Node-D', label: 'Node D (ap-south)', zone: 'Zone 4', status: 'healthy', vnodes: 8 },
  ];

  const seedPairs: Array<[string, string]> = [
    ['user:101', 'Maya Lin'],
    ['session:88a', 'active'],
    ['order:4092', 'dispatched'],
    ['shard:alpha', 'ready'],
    ['cache:home', 'ttl=300'],
    ['ledger:tx9', 'committed'],
    ['config:acl', 'strict'],
    ['metric:cpu', '42%'],
  ];

  return {
    nodes,
    entries: seedPairs.map(([k, v]) => createKeyEntry(k, v)),
    replicationFactor: 2,
  };
}
