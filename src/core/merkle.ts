import { hashString32, hashToHex } from './hashRing';

export interface MerkleNode {
  id: string;
  level: number;
  rangeLabel: string;
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  bucketIndex?: number;
  entries?: Array<{ key: string; value: string }>;
}

export interface MerkleDiffResult {
  inSync: boolean;
  comparisonsPerformed: number;
  totalLinearEntries: number;
  divergentNodeIds: string[];
  divergentBucketIndices: number[];
  checkedNodeIds: string[];
}

export const MERKLE_BUCKET_COUNT = 8;

export function getBucketIndex(key: string, bucketCount = MERKLE_BUCKET_COUNT): number {
  return hashString32(key) % bucketCount;
}

export function buildMerkleTree(
  records: Record<string, string>,
  bucketCount = MERKLE_BUCKET_COUNT
): MerkleNode {
  const buckets: Array<Array<{ key: string; value: string }>> = Array.from(
    { length: bucketCount },
    () => []
  );

  const sortedKeys = Object.keys(records).sort((a, b) => a.localeCompare(b));
  for (const key of sortedKeys) {
    const idx = getBucketIndex(key, bucketCount);
    buckets[idx].push({ key, value: records[key] });
  }

  let currentLevel: MerkleNode[] = buckets.map((entries, idx) => {
    const serialized = entries.map((e) => `${e.key}=${e.value}`).join('|');
    const hash = hashToHex(hashString32(`leaf:${idx}:${serialized}`));
    return {
      id: `L3-B${idx}`,
      level: 3,
      rangeLabel: `Bucket ${idx}`,
      hash,
      bucketIndex: idx,
      entries,
    };
  });

  let levelNum = 2;
  while (currentLevel.length > 1) {
    const nextLevel: MerkleNode[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1];
      const combined = right ? `${left.hash}:${right.hash}` : left.hash;
      const hash = hashToHex(hashString32(`internal:L${levelNum}:${i}:${combined}`));
      const rangeLabel =
        levelNum === 0
          ? 'Root (B0-B7)'
          : `${left.rangeLabel.replace('Bucket ', 'B')}–${
              right ? right.rangeLabel.replace('Bucket ', 'B') : ''
            }`;

      nextLevel.push({
        id: levelNum === 0 ? 'L0-ROOT' : `L${levelNum}-N${i / 2}`,
        level: levelNum,
        rangeLabel,
        hash,
        left,
        right,
      });
    }
    currentLevel = nextLevel;
    levelNum -= 1;
  }

  return currentLevel[0];
}

export function flattenMerkleTree(root: MerkleNode): MerkleNode[] {
  const nodes: MerkleNode[] = [];
  const queue: MerkleNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    nodes.push(node);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return nodes;
}

export function diffMerkleTrees(
  treeA: MerkleNode,
  treeB: MerkleNode,
  totalLinearEntries: number
): MerkleDiffResult {
  const divergentNodeIds: string[] = [];
  const divergentBucketIndices: number[] = [];
  const checkedNodeIds: string[] = [];
  let comparisonsPerformed = 0;

  function compare(nodeA: MerkleNode | undefined, nodeB: MerkleNode | undefined) {
    if (!nodeA || !nodeB) return;
    comparisonsPerformed += 1;
    checkedNodeIds.push(nodeA.id);

    if (nodeA.hash === nodeB.hash) {
      // Subtrees match identically: prune entire branch!
      return;
    }

    divergentNodeIds.push(nodeA.id);
    if (nodeA.bucketIndex !== undefined) {
      divergentBucketIndices.push(nodeA.bucketIndex);
      return;
    }

    compare(nodeA.left, nodeB.left);
    compare(nodeA.right, nodeB.right);
  }

  compare(treeA, treeB);

  return {
    inSync: divergentBucketIndices.length === 0,
    comparisonsPerformed,
    totalLinearEntries,
    divergentNodeIds,
    divergentBucketIndices: divergentBucketIndices.sort((a, b) => a - b),
    checkedNodeIds,
  };
}

export function syncDivergentBuckets(
  sourceRecords: Record<string, string>,
  targetRecords: Record<string, string>,
  divergentBucketIndices: number[]
): Record<string, string> {
  const bucketSet = new Set(divergentBucketIndices);
  const nextTarget: Record<string, string> = {};

  // Keep keys in non-divergent buckets intact
  for (const [k, v] of Object.entries(targetRecords)) {
    const bIdx = getBucketIndex(k);
    if (!bucketSet.has(bIdx)) {
      nextTarget[k] = v;
    }
  }

  // Copy authoritative keys for divergent buckets from source
  for (const [k, v] of Object.entries(sourceRecords)) {
    const bIdx = getBucketIndex(k);
    if (bucketSet.has(bIdx)) {
      nextTarget[k] = v;
    }
  }

  return nextTarget;
}

export function createSeedMerkleRecords(): {
  replicaA: Record<string, string>;
  replicaB: Record<string, string>;
} {
  const base: Record<string, string> = {
    'acct:001': 'verified',
    'acct:002': 'verified',
    'acct:003': 'pending',
    'acct:004': 'verified',
    'inv:101': 'qty=14',
    'inv:102': 'qty=9',
    'inv:103': 'qty=42',
    'inv:104': 'qty=0',
    'cfg:tls': '1.3',
    'cfg:region': 'us-east-1',
    'cfg:retry': '3',
    'cfg:timeout': '500ms',
    'log:1001': 'ok',
    'log:1002': 'ok',
    'log:1003': 'ok',
    'log:1004': 'ok',
  };

  return {
    replicaA: { ...base },
    replicaB: { ...base },
  };
}
