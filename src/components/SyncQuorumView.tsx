import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Edit3,
  GitCompare,
  GitMerge,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  Wrench,
} from 'lucide-react';
import {
  addOrSetItem,
  areReplicasConverged,
  compareVectorClocks,
  formatVectorClock,
  getActiveOrSetItems,
  gossipConvergeAll,
  removeOrSetItem,
  setLwwRegister,
  type CrdtReplica,
} from '../core/crdt';
import {
  buildMerkleTree,
  diffMerkleTrees,
  flattenMerkleTree,
  getBucketIndex,
  syncDivergentBuckets,
  type MerkleNode,
} from '../core/merkle';
import {
  executeQuorumRead,
  executeQuorumWrite,
  isStrongQuorum,
  type QuorumConfig,
  type QuorumNode,
  type QuorumReadResult,
} from '../core/quorum';
import { graphToMerkleRecords } from '../core/accessibilityOutput';
import type { GraphArc, GraphNode } from '../core/ocapGraph';

type SyncSubMode = 'merkle' | 'crdt' | 'quorum';

interface SyncQuorumViewProps {
  graphNodes: GraphNode[];
  graphArcs: GraphArc[];
  replicas: CrdtReplica[];
  onChangeReplicas: (replicas: CrdtReplica[]) => void;
  merkleReplicaB: Record<string, string>;
  onChangeMerkleReplicaB: (records: Record<string, string>) => void;
  quorumConfig: QuorumConfig;
  quorumNodes: QuorumNode[];
  latestWrittenVersion: number;
  onUpdateQuorum: (
    config: QuorumConfig,
    nodes: QuorumNode[],
    latestWrittenVersion: number
  ) => void;
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

export const SyncQuorumView: React.FC<SyncQuorumViewProps> = ({
  graphNodes,
  graphArcs,
  replicas,
  onChangeReplicas,
  merkleReplicaB,
  onChangeMerkleReplicaB,
  quorumConfig,
  quorumNodes,
  latestWrittenVersion,
  onUpdateQuorum,
  onAnnounce,
}) => {
  const [subMode, setSubMode] = useState<SyncSubMode>('merkle');

  // --- Merkle Graph Anti-Entropy state (Replica A derived live from Distributed Graph) ---
  const liveGraphRecords = useMemo(
    () => graphToMerkleRecords(graphNodes, graphArcs),
    [graphNodes, graphArcs]
  );

  const treeA = useMemo(() => buildMerkleTree(liveGraphRecords), [liveGraphRecords]);
  const treeB = useMemo(() => buildMerkleTree(merkleReplicaB), [merkleReplicaB]);
  const flatA = useMemo(() => flattenMerkleTree(treeA), [treeA]);
  const flatB = useMemo(() => flattenMerkleTree(treeB), [treeB]);

  const diff = useMemo(
    () => diffMerkleTrees(treeA, treeB, Object.keys(liveGraphRecords).length),
    [treeA, treeB, liveGraphRecords]
  );

  const [selectedMerkleId, setSelectedMerkleId] = useState<string>('L0-ROOT');
  const [selectedDriftKey, setSelectedDriftKey] = useState<string>(
    () => Object.keys(liveGraphRecords).sort()[0] ?? 'node:N1'
  );
  const [driftValue, setDriftValue] = useState<string>('corrupted-replica-b');
  const [driftError, setDriftError] = useState<string | null>(null);

  useEffect(() => {
    const keys = Object.keys(liveGraphRecords).sort();
    if (keys.length > 0 && !liveGraphRecords[selectedDriftKey]) {
      setSelectedDriftKey(keys[0]);
    }
  }, [liveGraphRecords, selectedDriftKey]);

  const divergentSet = useMemo(
    () => new Set(diff.divergentNodeIds),
    [diff.divergentNodeIds]
  );
  const selectedNodeA = flatA.find((n) => n.id === selectedMerkleId) ?? treeA;
  const selectedNodeB = flatB.find((n) => n.id === selectedMerkleId) ?? treeB;

  // --- CRDT State ---
  const [targetReplicaId, setTargetReplicaId] = useState(replicas[0]?.id ?? 'R1');
  const [orSetItemInput, setOrSetItemInput] = useState('');
  const [lwwKeyInput, setLwwKeyInput] = useState('');
  const [lwwValueInput, setLwwValueInput] = useState('');
  const lwwValRef = useRef<HTMLInputElement>(null);
  const [crdtError, setCrdtError] = useState<string | null>(null);
  const [opCounter, setOpCounter] = useState(100);

  const converged = useMemo(() => areReplicasConverged(replicas), [replicas]);
  const anyPartitioned = useMemo(
    () => replicas.some((r) => r.partitioned),
    [replicas]
  );

  // --- Quorum State ---
  const [writeValue, setWriteValue] = useState('graph-epoch-2');
  const [writeError, setWriteError] = useState<string | null>(null);
  const [enableReadRepair, setEnableReadRepair] = useState(true);
  const [readOffset, setReadOffset] = useState(2);
  const [lastRead, setLastRead] = useState<QuorumReadResult | null>(null);

  const strongQuorum = useMemo(() => isStrongQuorum(quorumConfig), [quorumConfig]);
  const reachableCount = useMemo(
    () => quorumNodes.slice(0, quorumConfig.n).filter((n) => n.reachable).length,
    [quorumNodes, quorumConfig.n]
  );

  // --- Merkle Handlers ---
  const handleInjectDrift = (e: React.FormEvent) => {
    e.preventDefault();
    const val = driftValue.trim();
    if (!val) {
      setDriftError('Enter a mutated record value to inject replica drift.');
      return;
    }
    setDriftError(null);
    const updatedB = {
      ...merkleReplicaB,
      [selectedDriftKey]: val,
    };
    onChangeMerkleReplicaB(updatedB);
    const bIdx = getBucketIndex(selectedDriftKey);
    onAnnounce(
      'warning',
      `Injected drift on graph record "${selectedDriftKey}" at Replica B (Bucket ${bIdx}). Merkle root diverges from live graph.`
    );
  };

  const handleRepairDivergent = () => {
    if (diff.inSync) {
      onAnnounce('info', 'Replica B already matches the live distributed graph.');
      return;
    }
    const repaired = syncDivergentBuckets(
      liveGraphRecords,
      merkleReplicaB,
      diff.divergentBucketIndices
    );
    onChangeMerkleReplicaB(repaired);
    onAnnounce(
      'success',
      `Synchronized ${diff.divergentBucketIndices.length} divergent graph bucket(s) [${diff.divergentBucketIndices.map((b) => `B${b}`).join(', ')}] in ${diff.comparisonsPerformed} hash comparisons.`
    );
  };

  const handleTreeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = flatA.findIndex((n) => n.id === selectedMerkleId);
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
    setSelectedMerkleId(target.id);
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
      const isDivergentEdge = divergentSet.has(child.id);
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

  // --- CRDT Handlers ---
  const handleTogglePartition = (replicaId: string) => {
    const target = replicas.find((r) => r.id === replicaId);
    if (!target) return;
    const nextPartitioned = !target.partitioned;
    const updated = replicas.map((r) =>
      r.id === replicaId ? { ...r, partitioned: nextPartitioned } : r
    );
    onChangeReplicas(updated);
    onAnnounce(
      nextPartitioned ? 'warning' : 'info',
      nextPartitioned
        ? `${replicaId} partitioned from graph gossip sync. Writes will diverge until healed.`
        : `${replicaId} reconnected. Run Heal & Sync All to merge graph tag state.`
    );
  };

  const handleAddOrSet = (e: React.FormEvent) => {
    e.preventDefault();
    const item = orSetItemInput.trim();
    if (!item) {
      setCrdtError('Enter a tag or node membership entry before adding to the OR-Set.');
      return;
    }
    setCrdtError(null);
    const seq = opCounter + 1;
    setOpCounter(seq);
    const updated = replicas.map((r) =>
      r.id === targetReplicaId ? addOrSetItem(r, item, seq) : r
    );
    onChangeReplicas(updated);
    setOrSetItemInput('');
    onAnnounce('info', `Added OR-Set entry "${item}" on ${targetReplicaId}.`);
  };

  const handleRemoveOrSet = (replicaId: string, item: string) => {
    const updated = replicas.map((r) =>
      r.id === replicaId ? removeOrSetItem(r, item) : r
    );
    onChangeReplicas(updated);
    onAnnounce('info', `Removed OR-Set entry "${item}" on ${replicaId}.`);
  };

  const handleSetLww = (e: React.FormEvent) => {
    e.preventDefault();
    const key = lwwKeyInput.trim();
    const val = lwwValueInput.trim();
    if (!key || !val) {
      setCrdtError('Both register key and value are required for LWW-Map updates.');
      return;
    }
    setCrdtError(null);
    const updated = replicas.map((r) =>
      r.id === targetReplicaId ? setLwwRegister(r, key, val) : r
    );
    onChangeReplicas(updated);
    setLwwKeyInput('');
    setLwwValueInput('');
    onAnnounce('info', `Updated LWW register "${key}" = "${val}" on ${targetReplicaId}.`);
  };

  const handleGossipSync = () => {
    const healed = replicas.map((r) => ({ ...r, partitioned: false }));
    const synced = gossipConvergeAll(healed);
    onChangeReplicas(synced);
    onAnnounce(
      'success',
      'Healed partitions and converged all CRDT graph replicas via state-based gossip merge.'
    );
  };

  // --- Quorum Handlers ---
  const handleUpdateW = (w: number) => {
    const nextConfig = { ...quorumConfig, w };
    onUpdateQuorum(nextConfig, quorumNodes, latestWrittenVersion);
    onAnnounce(
      isStrongQuorum(nextConfig) ? 'success' : 'warning',
      `Set Write Quorum W=${w}. W+R = ${w + quorumConfig.r} vs N=${quorumConfig.n} (${
        isStrongQuorum(nextConfig) ? 'Strong quorum active' : 'Stale reads possible'
      }).`
    );
  };

  const handleUpdateR = (r: number) => {
    const nextConfig = { ...quorumConfig, r };
    onUpdateQuorum(nextConfig, quorumNodes, latestWrittenVersion);
    onAnnounce(
      isStrongQuorum(nextConfig) ? 'success' : 'warning',
      `Set Read Quorum R=${r}. W+R = ${quorumConfig.w + r} vs N=${quorumConfig.n} (${
        isStrongQuorum(nextConfig) ? 'Strong quorum active' : 'Stale reads possible'
      }).`
    );
  };

  const handleToggleReachable = (nodeId: string) => {
    const target = quorumNodes.find((n) => n.id === nodeId);
    if (!target) return;
    const nextReachable = !target.reachable;
    const updated = quorumNodes.map((n) =>
      n.id === nodeId ? { ...n, reachable: nextReachable } : n
    );
    onUpdateQuorum(quorumConfig, updated, latestWrittenVersion);
    onAnnounce(
      nextReachable ? 'info' : 'warning',
      `Quorum replica ${nodeId} marked ${nextReachable ? 'Reachable' : 'Offline'}.`
    );
  };

  const handleQuorumWrite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeValue.trim()) {
      setWriteError('Enter a graph epoch or payload value before issuing a quorum write.');
      return;
    }
    setWriteError(null);
    const res = executeQuorumWrite(
      quorumNodes,
      quorumConfig,
      writeValue,
      latestWrittenVersion,
      0
    );
    onUpdateQuorum(quorumConfig, res.nodes, res.writtenVersion);
    onAnnounce(res.success ? 'success' : 'warning', res.message);
  };

  const handleQuorumRead = () => {
    const res = executeQuorumRead(
      quorumNodes,
      quorumConfig,
      latestWrittenVersion,
      enableReadRepair,
      readOffset
    );
    setLastRead(res);
    if (res.success) {
      onUpdateQuorum(quorumConfig, res.nodes, latestWrittenVersion);
    }
    onAnnounce(
      !res.success || res.isStaleRead ? 'warning' : 'success',
      res.message
    );
  };

  return (
    <section aria-labelledby="sync-quorum-heading" className="space-y-6">
      {/* Shared Live Graph Replication Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--border-hairline)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-xl">
          <h1
            id="sync-quorum-heading"
            className="text-2xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            Distributed Graph Sync &amp; Quorum Replication
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Reconcile replicas of your live distributed graph ({graphNodes.length} nodes,{' '}
            {graphArcs.length} arcs) using Merkle anti-entropy, CRDT gossip, and N/W/R quorums.
          </p>
        </div>

        {/* Sub-view Switcher */}
        <div
          role="tablist"
          aria-label="Replication and consistency mechanisms"
          className="inline-flex rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1 shrink-0"
        >
          {[
            { id: 'merkle' as const, label: 'Merkle Graph Sync' },
            { id: 'crdt' as const, label: 'CRDT Replicas' },
            { id: 'quorum' as const, label: 'Quorum (N/W/R)' },
          ].map((tab) => {
            const active = subMode === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setSubMode(tab.id)}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text-on)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Cluster Sync Strip */}
      <dl className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-[var(--text-muted)]">Live Graph Merkle Root</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 font-mono text-sm font-semibold text-[var(--text-primary)]">
            {diff.inSync ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
            )}
            <span>
              {treeA.hash} · {diff.inSync ? 'Replica B In Sync' : `${diff.divergentBucketIndices.length} Bucket(s) Divergent`}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)]">CRDT Gossip Replicas</dt>
          <dd className="mt-0.5 font-mono text-sm font-semibold text-[var(--text-primary)]">
            {converged ? 'Converged (3/3)' : 'Divergent'} ·{' '}
            {replicas.filter((r) => !r.partitioned).length}/3 connected
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)]">Active Quorum Overlap</dt>
          <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
            W({quorumConfig.w})+R({quorumConfig.r})={quorumConfig.w + quorumConfig.r}{' '}
            {strongQuorum ? '>' : '<='} N({quorumConfig.n}) · v{latestWrittenVersion}
          </dd>
        </div>
      </dl>

      {/* PANEL 1: MERKLE ANTI-ENTROPY OVER LIVE GRAPH */}
      {subMode === 'merkle' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className={`inline-flex items-center gap-2 text-sm font-semibold ${
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
              <span>
                {diff.inSync
                  ? 'Live Graph (Replica A) matches Replica B'
                  : `Divergence detected vs Live Graph in bucket(s): ${diff.divergentBucketIndices.map((b) => `B${b}`).join(', ')}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onAnnounce(
                    diff.inSync ? 'success' : 'warning',
                    diff.inSync
                      ? `Merkle comparison complete: live graph roots match in 1 check (vs ${diff.totalLinearEntries} graph entries).`
                      : `Merkle diff checked ${diff.comparisonsPerformed} nodes (vs ${diff.totalLinearEntries} graph entries) and isolated divergent bucket(s): ${diff.divergentBucketIndices.map((b) => `B${b}`).join(', ')}.`
                  )
                }
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
              >
                <GitCompare className="h-4 w-4" aria-hidden="true" />
                <span>Compare Graph Trees</span>
              </button>

              <button
                type="button"
                onClick={handleRepairDivergent}
                disabled={diff.inSync}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Repair Divergent Buckets</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Tree Canvas */}
            <div className="lg:col-span-8 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    Live Graph Binary Merkle Tree (Replica A vs Replica B)
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Replica A hashes all live graph nodes and arcs. Use ArrowLeft / ArrowRight to inspect buckets.
                  </p>
                </div>
                <div className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                  Checks: <strong>{diff.comparisonsPerformed}</strong> / Records:{' '}
                  <strong>{diff.totalLinearEntries}</strong>
                </div>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-label="Live graph Merkle tree comparison diagram. Use ArrowLeft and ArrowRight to step through nodes."
                onKeyDown={handleTreeKeyDown}
                className="mt-4 overflow-x-auto rounded-lg bg-[var(--bg-subtle)] p-3"
              >
                <svg
                  viewBox="0 0 520 300"
                  className="mx-auto h-64 w-full min-w-[460px]"
                  role="img"
                  aria-label="Binary Merkle tree hashing live distributed graph nodes and arcs"
                >
                  {renderEdges(treeA)}
                  {flatA.map((node) => {
                    const pos = TREE_COORDS[node.id];
                    if (!pos) return null;
                    const isDivergent = divergentSet.has(node.id);
                    const isSelected = selectedMerkleId === node.id;
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
                          setSelectedMerkleId(node.id);
                          onAnnounce(
                            'info',
                            `Selected ${node.rangeLabel}: Live Graph hash ${node.hash}, Replica B hash ${
                              flatB.find((b) => b.id === node.id)?.hash ?? ''
                            }.`
                          );
                        }}
                      >
                        <title>{`${node.rangeLabel} | Graph: ${node.hash}`}</title>
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

              {/* Inspector */}
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[var(--border-hairline)] pt-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                    Replica A (Live Graph) · {selectedNodeA.rangeLabel}
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
                    Replica B (Standby) · {selectedNodeB.rangeLabel}
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

            {/* Drift Simulator + Bucket Table */}
            <div className="lg:col-span-4 space-y-6">
              <form
                onSubmit={handleInjectDrift}
                noValidate
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
              >
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Simulate Graph Drift on Replica B
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Corrupt a live node or arc record on Replica B, then repair only divergent Merkle buckets.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="merkle-key-select"
                      className="block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Graph Record Key
                    </label>
                    <select
                      id="merkle-key-select"
                      value={selectedDriftKey}
                      onChange={(e) => setSelectedDriftKey(e.target.value)}
                      className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                    >
                      {Object.keys(liveGraphRecords)
                        .sort()
                        .map((k) => (
                          <option key={k} value={k}>
                            {k} (B{getBucketIndex(k)})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="merkle-drift-val"
                      className="block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Drifted Payload
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
                  className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
                >
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                  <span>Mutate Record on Replica B</span>
                </button>
              </form>

              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Leaf Bucket Hash Matrix
                </h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                        <th scope="col" className="py-2 pr-2">Bucket</th>
                        <th scope="col" className="py-2 pr-2">Graph (A)</th>
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
                                  onClick={() => setSelectedMerkleId(nodeA.id)}
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
        </div>
      )}

      {/* PANEL 2: CRDT REPLICAS */}
      {subMode === 'crdt' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className={`inline-flex items-center gap-2 text-sm font-semibold ${
                converged
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {converged ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {converged
                  ? 'All Graph Tag & Config Replicas Converged'
                  : 'Replicas Diverged During Partition / Local Writes'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGossipSync}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
            >
              <GitMerge className="h-4 w-4" aria-hidden="true" />
              <span>{anyPartitioned ? 'Heal & Sync All' : 'Gossip Sync All'}</span>
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:w-60">
                <label
                  htmlFor="crdt-target-replica"
                  className="block text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Target Replica
                </label>
                <select
                  id="crdt-target-replica"
                  value={targetReplicaId}
                  onChange={(e) => setTargetReplicaId(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
                >
                  {replicas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} {r.partitioned ? '(Partitioned)' : '(Connected)'}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleAddOrSet} noValidate className="flex flex-1 flex-wrap items-end gap-2">
                <div className="min-w-[160px] flex-1">
                  <label
                    htmlFor="crdt-orset-input"
                    className="block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    Add OR-Set Graph Tag
                  </label>
                  <input
                    id="crdt-orset-input"
                    type="text"
                    value={orSetItemInput}
                    onChange={(e) => {
                      setOrSetItemInput(e.target.value);
                      if (crdtError) setCrdtError(null);
                    }}
                    placeholder="e.g. group:verified"
                    className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add Tag</span>
                </button>
              </form>

              <form onSubmit={handleSetLww} noValidate className="flex flex-1 flex-wrap items-end gap-2">
                <div className="min-w-[110px] flex-1">
                  <label
                    htmlFor="crdt-lww-key"
                    className="block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    LWW Property
                  </label>
                  <input
                    id="crdt-lww-key"
                    type="text"
                    value={lwwKeyInput}
                    onChange={(e) => {
                      setLwwKeyInput(e.target.value);
                      if (crdtError) setCrdtError(null);
                    }}
                    placeholder="replication"
                    className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div className="min-w-[100px] flex-1">
                  <label
                    htmlFor="crdt-lww-val"
                    className="block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    Value
                  </label>
                  <input
                    ref={lwwValRef}
                    id="crdt-lww-val"
                    type="text"
                    value={lwwValueInput}
                    onChange={(e) => {
                      setLwwValueInput(e.target.value);
                      if (crdtError) setCrdtError(null);
                    }}
                    placeholder="strict"
                    className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
                >
                  <span>Set Register</span>
                </button>
              </form>
            </div>
            {crdtError && (
              <p role="alert" className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
                {crdtError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {replicas.map((replica, idx) => {
              const activeItems = getActiveOrSetItems(replica);
              const lwwEntries = Object.values(replica.lwwMap).sort((a, b) =>
                a.key.localeCompare(b.key)
              );
              const relationToPrimary =
                idx === 0
                  ? 'baseline'
                  : compareVectorClocks(replica.vectorClock, replicas[0].vectorClock);

              return (
                <article
                  key={replica.id}
                  aria-label={replica.label}
                  className="flex flex-col rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--text-primary)]">
                        {replica.label}
                      </h2>
                      <p
                        className={`mt-1 inline-flex items-center gap-1.5 text-xs font-medium ${
                          replica.partitioned
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {replica.partitioned ? (
                          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>{replica.partitioned ? 'Partitioned' : 'Connected'}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePartition(replica.id)}
                      aria-pressed={replica.partitioned}
                      className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                    >
                      {replica.partitioned ? 'Reconnect' : 'Partition'}
                    </button>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between">
                      <span>Vector Clock</span>
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {formatVectorClock(replica.vectorClock)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lamport / Rel</span>
                      <span className="font-mono">
                        t={replica.lamportClock} · {relationToPrimary}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                      OR-Set Members ({activeItems.length})
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {activeItems.map((item) => (
                        <li key={item} className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-[var(--text-primary)]">{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOrSet(replica.id, item)}
                            aria-label={`Remove ${item} from ${replica.id}`}
                            className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[var(--border-hairline)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            <span>Remove</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                      LWW-Register Map ({lwwEntries.length})
                    </h3>
                    <dl className="mt-2 space-y-1.5 text-xs">
                      {lwwEntries.map((entry) => (
                        <div key={entry.key} className="flex items-center justify-between gap-2">
                          <dt className="font-mono text-[var(--text-secondary)]">{entry.key}</dt>
                          <dd className="flex items-center gap-2 font-mono font-semibold text-[var(--text-primary)]">
                            <span>
                              {entry.value}{' '}
                              <span className="font-normal text-[var(--text-muted)]">
                                (t={entry.timestamp})
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetReplicaId(replica.id);
                                setLwwKeyInput(entry.key);
                                setLwwValueInput(entry.value);
                                onAnnounce(
                                  'info',
                                  `Loaded LWW register "${entry.key}" on ${replica.id} for editing.`
                                );
                                setTimeout(() => lwwValRef.current?.focus(), 0);
                              }}
                              aria-label={`Edit LWW register ${entry.key} on ${replica.id}`}
                              className="inline-flex min-h-[26px] items-center gap-1 rounded border border-[var(--border-hairline)] px-1.5 py-0.5 font-sans text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* PANEL 3: QUORUM N/W/R */}
      {subMode === 'quorum' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Quorum Thresholds (N = {quorumConfig.n})
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {reachableCount} of {quorumConfig.n} replicas reachable for graph commits.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <label htmlFor="slider-w" className="text-[var(--text-secondary)]">
                  Write Quorum (W)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateW(Math.max(1, quorumConfig.w - 1))}
                    disabled={quorumConfig.w <= 1}
                    aria-label="Decrease Write Quorum (W)"
                    className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-[var(--text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Minus className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <span className="min-w-[44px] text-center font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                    W = {quorumConfig.w}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateW(Math.min(quorumConfig.n, quorumConfig.w + 1))
                    }
                    disabled={quorumConfig.w >= quorumConfig.n}
                    aria-label="Increase Write Quorum (W)"
                    className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-[var(--text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <input
                id="slider-w"
                type="range"
                min={1}
                max={quorumConfig.n}
                value={quorumConfig.w}
                onChange={(e) => handleUpdateW(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <label htmlFor="slider-r" className="text-[var(--text-secondary)]">
                  Read Quorum (R)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateR(Math.max(1, quorumConfig.r - 1))}
                    disabled={quorumConfig.r <= 1}
                    aria-label="Decrease Read Quorum (R)"
                    className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-[var(--text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Minus className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <span className="min-w-[44px] text-center font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                    R = {quorumConfig.r}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateR(Math.min(quorumConfig.n, quorumConfig.r + 1))
                    }
                    disabled={quorumConfig.r >= quorumConfig.n}
                    aria-label="Increase Read Quorum (R)"
                    className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-[var(--text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <input
                id="slider-r"
                type="range"
                min={1}
                max={quorumConfig.n}
                value={quorumConfig.r}
                onChange={(e) => handleUpdateR(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-4 space-y-3">
              <form onSubmit={handleQuorumWrite} noValidate className="space-y-2">
                <label
                  htmlFor="quorum-write-input"
                  className="block text-xs font-medium text-[var(--text-secondary)]"
                >
                  Write Graph Epoch Value
                </label>
                <div className="flex gap-2">
                  <input
                    id="quorum-write-input"
                    type="text"
                    value={writeValue}
                    onChange={(e) => {
                      setWriteValue(e.target.value);
                      if (writeError) setWriteError(null);
                    }}
                    className="min-h-[40px] flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Write (W={quorumConfig.w})</span>
                  </button>
                </div>
                {writeError && (
                  <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                    {writeError}
                  </p>
                )}
              </form>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableReadRepair}
                    onChange={(e) => setEnableReadRepair(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent-primary)]"
                  />
                  <span>Enable Read-Repair</span>
                </label>

                <div className="flex items-center gap-2">
                  <select
                    aria-label="Read coordinator start replica"
                    value={readOffset}
                    onChange={(e) => setReadOffset(Number(e.target.value))}
                    className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-1 font-mono text-xs text-[var(--text-primary)]"
                  >
                    <option value={0}>Start Q1</option>
                    <option value={2}>Start Q3</option>
                    <option value={3}>Start Q4</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleQuorumRead}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Read (R={quorumConfig.r})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Quorum Replica State Table (v{latestWrittenVersion})
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-muted)]">
                      <th scope="col" className="py-2 pr-3">Replica</th>
                      <th scope="col" className="py-2 pr-3">Version</th>
                      <th scope="col" className="py-2 pr-3">Value</th>
                      <th scope="col" className="py-2 pr-3">Freshness</th>
                      <th scope="col" className="py-2 text-right">Network</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {quorumNodes.map((node) => {
                      const isFresh = node.version >= latestWrittenVersion;
                      return (
                        <tr key={node.id}>
                          <td className="py-2.5 pr-3 font-semibold text-[var(--text-primary)]">
                            {node.id} · {node.label}
                          </td>
                          <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--text-primary)]">
                            v{node.version}
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-xs text-[var(--text-secondary)]">
                            {node.value ?? 'null'}
                          </td>
                          <td
                            className={`py-2.5 pr-3 text-xs font-medium ${
                              isFresh
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {isFresh ? 'Up-to-date' : 'Stale'}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleReachable(node.id)}
                              aria-pressed={!node.reachable}
                              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                            >
                              {node.reachable ? (
                                <>
                                  <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Reachable</span>
                                </>
                              ) : (
                                <>
                                  <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Offline</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {lastRead && (
              <div
                role="status"
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
              >
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Last Quorum Read Result
                </h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{lastRead.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
