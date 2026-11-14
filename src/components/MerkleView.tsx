import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import {
  buildMerkleTree,
  diffMerkleTrees,
  flattenMerkleTree,
  getBucketIndex,
  syncDivergentBuckets,
  type MerkleNode,
} from '../core/merkle';

interface MerkleViewProps {
  replicaA: Record<string, string>;
  replicaB: Record<string, string>;
  onChangeReplicaB: (records: Record<string, string>) => void;
  onAnnounce: (severity: 'info' | 'warning' | 'success', summary: string) => void;
}

const TREE_COORDS: Record<string, { x: number; y: number }> = {
  'L0-ROOT': { x: 260, y: 36 },
  'L1-N0': { x: 140, y: 108 },
  'L1-N1': { x: 380, y: 108 },
  'L2-N0': { x: 80, y: 184 },
  'L2-N1': { x: 200, y: 184 },
  'L2-N2': { x: 320, y: 184 },
  'L2-N3': { x: 440, y: 184 },
  'L3-B0': { x: 48, y: 264 },
  'L3-B1': { x: 110, y: 264 },
  'L3-B2': { x: 170, y: 264 },
  'L3-B3': { x: 230, y: 264 },
  'L3-B4': { x: 290, y: 264 },
  'L3-B5': { x: 350, y: 264 },
  'L3-B6': { x: 410, y: 264 },
  'L3-B7': { x: 470, y: 264 },
};

export const MerkleView: React.FC<MerkleViewProps> = ({
  replicaA,
  replicaB,
  onChangeReplicaB,
  onAnnounce,
}) => {
  const treeA = useMemo(() => buildMerkleTree(replicaA), [replicaA]);
  const treeB = useMemo(() => buildMerkleTree(replicaB), [replicaB]);

  const flatA = useMemo(() => flattenMerkleTree(treeA), [treeA]);
  const flatB = useMemo(() => flattenMerkleTree(treeB), [treeB]);

  const diff = useMemo(
    () => diffMerkleTrees(treeA, treeB, Object.keys(replicaA).length),
    [treeA, treeB, replicaA]
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string>('L0-ROOT');
  const [selectedDriftKey, setSelectedDriftKey] = useState<string>(
    Object.keys(replicaB).sort()[0] ?? 'acct:003'
  );
  const [driftValue, setDriftValue] = useState<string>('corrupted-v9');
  const [driftError, setDriftError] = useState<string | null>(null);
  const [hasRunDiff, setHasRunDiff] = useState<boolean>(true);

  const divergentSet = useMemo(
    () => new Set(diff.divergentNodeIds),
    [diff.divergentNodeIds]
  );

  const selectedNodeA = flatA.find((n) => n.id === selectedNodeId) ?? treeA;
  const selectedNodeB = flatB.find((n) => n.id === selectedNodeId) ?? treeB;

  const handleInjectDrift = (e: React.FormEvent) => {
    e.preventDefault();
    const val = driftValue.trim();
    if (!val) {
      setDriftError('Enter a mutated value to inject replica drift.');
      return;
    }
    setDriftError(null);
    const updatedB = {
      ...replicaB,
      [selectedDriftKey]: val,
    };
    onChangeReplicaB(updatedB);
    setHasRunDiff(true);
    const bIdx = getBucketIndex(selectedDriftKey);
    onAnnounce(
      'warning',
      `Mutated key "${selectedDriftKey}" on Replica B (Bucket ${bIdx}). Merkle root hash now diverges from Replica A.`
    );
  };

  const handleRepairDivergent = () => {
    if (diff.inSync) {
      onAnnounce('info', 'Replicas are already synchronized. Zero buckets required transfer.');
      return;
    }
    const repaired = syncDivergentBuckets(
      replicaA,
      replicaB,
      diff.divergentBucketIndices
    );
    onChangeReplicaB(repaired);
    onAnnounce(
      'success',
      `Anti-entropy repair synchronized ${diff.divergentBucketIndices.length} divergent bucket(s) [${diff.divergentBucketIndices.map((b) => `B${b}`).join(', ')}] in ${diff.comparisonsPerformed} hash comparisons.`
    );
  };

  const handleTreeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = flatA.findIndex((n) => n.id === selectedNodeId);
    let nextIdx = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (idx + 1) % flatA.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (idx - 1 + flatA.length) % flatA.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = flatA.length - 1;
    } else {
      return;
    }
    const target = flatA[nextIdx];
    setSelectedNodeId(target.id);
    onAnnounce(
      'info',
      `Inspected Merkle node ${target.rangeLabel}. Status: ${divergentSet.has(target.id) ? 'Hash mismatch' : 'Hashes match'}.`
    );
  };

  const renderEdges = (node: MerkleNode): React.ReactNode[] => {
    const edges: React.ReactNode[] = [];
    const parentPos = TREE_COORDS[node.id];
    if (!parentPos) return edges;
    for (const child of [node.left, node.right]) {
      if (!child) continue;
      const childPos = TREE_COORDS[child.id];
      if (!childPos) continue;
      const isDivergentEdge = hasRunDiff && divergentSet.has(child.id);
      edges.push(
        <line
          key={`${node.id}-${child.id}`}
          x1={parentPos.x}
          y1={parentPos.y + 14}
          x2={childPos.x}
          y2={childPos.y - 14}
          stroke={isDivergentEdge ? '#dc2626' : 'var(--border-hairline)'}
          strokeWidth={isDivergentEdge ? 2.5 : 1.5}
        />
      );
      edges.push(...renderEdges(child));
    }
    return edges;
  };

  return (
    <section aria-labelledby="merkle-heading" className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-[var(--border-hairline)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="merkle-heading" className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Merkle Tree Anti-Entropy Sync
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Compare binary hash trees across replicas to isolate divergent key buckets without scanning every record.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div
            className={`inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap ${
              diff.inSync
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {diff.inSync ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{diff.inSync ? 'Roots Match (In Sync)' : 'Root Mismatch Detected'}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setHasRunDiff(true);
              onAnnounce(
                diff.inSync ? 'success' : 'warning',
                diff.inSync
                  ? `Merkle comparison complete: roots match in 1 root hash check (vs ${diff.totalLinearEntries} linear keys).`
                  : `Merkle diff checked ${diff.comparisonsPerformed} nodes (vs ${diff.totalLinearEntries} keys) and isolated divergent bucket(s): ${diff.divergentBucketIndices.map((b) => `B${b}`).join(', ')}.`
              );
            }}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <GitCompare className="h-4 w-4" aria-hidden="true" />
            <span>Compare Trees</span>
          </button>

          <button
            type="button"
            onClick={handleRepairDivergent}
            disabled={diff.inSync}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Repair Divergent Buckets</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Tree Canvas */}
        <div className="lg:col-span-8 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Binary Hash Tree Diff (Replica A vs Replica B)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Navigate nodes with ArrowLeft / ArrowRight keys. Matching subtrees are pruned immediately.
              </p>
            </div>
            <div className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
              Hash Checks: <strong>{diff.comparisonsPerformed}</strong> / Linear Scan:{' '}
              <strong>{diff.totalLinearEntries}</strong>
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Merkle tree comparison diagram. Use ArrowLeft and ArrowRight to step through tree nodes."
            onKeyDown={handleTreeKeyDown}
            className="mt-4 overflow-x-auto rounded-lg bg-[var(--bg-subtle)] p-3"
          >
            <svg
              viewBox="0 0 520 300"
              className="mx-auto h-64 w-full min-w-[460px]"
              role="img"
              aria-label="Binary Merkle tree showing root, internal branches, and 8 leaf buckets"
            >
              {renderEdges(treeA)}
              {flatA.map((node) => {
                const pos = TREE_COORDS[node.id];
                if (!pos) return null;
                const isDivergent = hasRunDiff && divergentSet.has(node.id);
                const isSelected = selectedNodeId === node.id;
                const shortName =
                  node.id === 'L0-ROOT'
                    ? 'ROOT'
                    : node.id === 'L1-N0'
                      ? 'B0..B3'
                      : node.id === 'L1-N1'
                        ? 'B4..B7'
                        : node.bucketIndex !== undefined
                          ? `B${node.bucketIndex}`
                          : node.rangeLabel.replace('–', '-');
                const boxWidth =
                  node.level === 1 ? 66 : node.level === 2 ? 54 : node.level === 0 ? 58 : 44;
                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      onAnnounce(
                        'info',
                        `Selected ${node.rangeLabel}: Replica A hash ${node.hash}, Replica B hash ${
                          flatB.find((b) => b.id === node.id)?.hash ?? ''
                        }.`
                      );
                    }}
                  >
                    <title>{`${node.rangeLabel} | A: ${node.hash}`}</title>
                    <rect
                      x={pos.x - boxWidth / 2}
                      y={pos.y - 14}
                      width={boxWidth}
                      height="28"
                      rx="6"
                      fill={
                        isDivergent
                          ? '#dc2626'
                          : isSelected
                            ? 'var(--accent-primary)'
                            : 'var(--bg-surface)'
                      }
                      stroke={
                        isSelected
                          ? 'var(--text-primary)'
                          : isDivergent
                            ? '#991b1b'
                            : 'var(--border-hairline)'
                      }
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      className={`text-[10px] font-mono font-semibold ${
                        isDivergent || isSelected
                          ? 'fill-white'
                          : 'fill-[var(--text-primary)]'
                      }`}
                    >
                      {shortName}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected Node Side-by-Side Inspector */}
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[var(--border-hairline)] pt-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                Replica A (Authoritative) · {selectedNodeA.rangeLabel}
              </h3>
              <p className="mt-1 font-mono text-sm font-semibold text-[var(--text-primary)]">
                {selectedNodeA.hash}
              </p>
              {selectedNodeA.entries && (
                <ul className="mt-2 space-y-1 text-xs font-mono text-[var(--text-secondary)]">
                  {selectedNodeA.entries.map((item) => (
                    <li key={item.key}>
                      {item.key} = {item.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                Replica B (Target) · {selectedNodeB.rangeLabel}
              </h3>
              <p
                className={`mt-1 font-mono text-sm font-semibold ${
                  selectedNodeA.hash !== selectedNodeB.hash
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {selectedNodeB.hash} (
                {selectedNodeA.hash === selectedNodeB.hash ? 'Match' : 'Divergent'})
              </p>
              {selectedNodeB.entries && (
                <ul className="mt-2 space-y-1 text-xs font-mono text-[var(--text-secondary)]">
                  {selectedNodeB.entries.map((item) => (
                    <li key={item.key}>
                      {item.key} = {item.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right: Inject Drift Form + Bucket Table */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleInjectDrift}
            noValidate
            className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
          >
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Simulate Replica Drift on Replica B
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Modify a single record on Replica B to trigger Merkle root divergence.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="merkle-key-select"
                  className="block text-xs font-medium text-[var(--text-secondary)]"
                >
                  Select Record Key
                </label>
                <select
                  id="merkle-key-select"
                  value={selectedDriftKey}
                  onChange={(e) => setSelectedDriftKey(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                >
                  {Object.keys(replicaB)
                    .sort()
                    .map((k) => (
                      <option key={k} value={k}>
                        {k} (Bucket {getBucketIndex(k)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="merkle-drift-val"
                  className="block text-xs font-medium text-[var(--text-secondary)]"
                >
                  Corrupted / Drifted Value
                </label>
                <input
                  id="merkle-drift-val"
                  type="text"
                  value={driftValue}
                  onChange={(e) => {
                    setDriftValue(e.target.value);
                    if (driftError) setDriftError(null);
                  }}
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            {driftError && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {driftError}
              </p>
            )}

            <button
              type="submit"
              className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              <Wrench className="h-4 w-4" aria-hidden="true" />
              <span>Mutate Key on Replica B</span>
            </button>
          </form>

          {/* Accessible Leaf Bucket Comparison Table */}
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Leaf Bucket Hash Matrix
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                    <th scope="col" className="py-2 pr-2">Bucket</th>
                    <th scope="col" className="py-2 pr-2">Replica A</th>
                    <th scope="col" className="py-2 pr-2">Replica B</th>
                    <th scope="col" className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)] font-mono">
                  {flatA
                    .filter((n) => n.bucketIndex !== undefined)
                    .map((nodeA) => {
                      const nodeB = flatB.find((b) => b.id === nodeA.id)!;
                      const match = nodeA.hash === nodeB.hash;
                      return (
                        <tr key={nodeA.id}>
                          <td className="py-2 pr-2 font-semibold text-[var(--text-primary)]">
                            <button
                              type="button"
                              onClick={() => setSelectedNodeId(nodeA.id)}
                              className="hover:underline cursor-pointer"
                            >
                              B{nodeA.bucketIndex}
                            </button>
                          </td>
                          <td className="py-2 pr-2 text-[var(--text-secondary)]">
                            {nodeA.hash.slice(0, 6)}
                          </td>
                          <td className="py-2 pr-2 text-[var(--text-secondary)]">
                            {nodeB.hash.slice(0, 6)}
                          </td>
                          <td
                            className={`py-2 font-sans font-medium ${
                              match
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {match ? 'Match' : 'Divergent'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
