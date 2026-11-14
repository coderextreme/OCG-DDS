import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Edit3, Plus, Power, PowerOff, Search, Trash2, XCircle } from 'lucide-react';
import {
  buildVirtualRing,
  computeRingMetrics,
  createKeyEntry,
  hashToHex,
  resolveKeyPlacement,
  type RingKeyEntry,
  type RingNode,
} from '../core/hashRing';
import type { GraphNode } from '../core/ocapGraph';

interface HashRingViewProps {
  graphNodes?: GraphNode[];
  nodes: RingNode[];
  entries: RingKeyEntry[];
  replicationFactor: number;
  onChangeNodes: (nodes: RingNode[]) => void;
  onChangeEntries: (entries: RingKeyEntry[]) => void;
  onChangeReplicationFactor: (rf: number) => void;
  onAnnounce: (severity: 'info' | 'warning' | 'success', summary: string) => void;
}

const NODE_COLORS = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777', '#0d9488'];

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export const HashRingView: React.FC<HashRingViewProps> = ({
  graphNodes = [],
  nodes,
  entries,
  replicationFactor,
  onChangeNodes,
  onChangeEntries,
  onChangeReplicationFactor,
  onAnnounce,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeyName, setSelectedKeyName] = useState<string | null>(
    entries[0]?.key ?? null
  );
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [nodeError, setNodeError] = useState<string | null>(null);
  const valInputRef = useRef<HTMLInputElement>(null);

  const sortedVnodes = useMemo(() => buildVirtualRing(nodes), [nodes]);

  const placements = useMemo(
    () =>
      entries.map((entry) =>
        resolveKeyPlacement(entry, sortedVnodes, replicationFactor)
      ),
    [entries, sortedVnodes, replicationFactor]
  );

  const metrics = useMemo(
    () => computeRingMetrics(nodes, placements, sortedVnodes),
    [nodes, placements, sortedVnodes]
  );

  const filteredPlacements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return placements;
    return placements.filter(
      (p) =>
        p.entry.key.toLowerCase().includes(q) ||
        p.entry.value.toLowerCase().includes(q) ||
        (p.primaryNodeId ?? '').toLowerCase().includes(q)
    );
  }, [placements, searchQuery]);

  const selectedPlacement = useMemo(
    () =>
      placements.find((p) => p.entry.key === selectedKeyName) ??
      placements[0] ??
      null,
    [placements, selectedKeyName]
  );

  const nodeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    nodes.forEach((n, idx) => {
      map[n.id] = NODE_COLORS[idx % NODE_COLORS.length];
    });
    return map;
  }, [nodes]);

  const handleInsertKey = (e: React.FormEvent) => {
    e.preventDefault();
    const k = keyInput.trim();
    const v = valueInput.trim();
    if (!k) {
      setFormError('Key identifier is required before inserting into the ring.');
      return;
    }
    if (!v) {
      setFormError('Value payload is required before inserting into the ring.');
      return;
    }
    setFormError(null);
    const nextEntry = createKeyEntry(k, v);
    const exists = entries.some((item) => item.key === k);
    const updated = exists
      ? entries.map((item) => (item.key === k ? nextEntry : item))
      : [nextEntry, ...entries];

    onChangeEntries(updated);
    setSelectedKeyName(k);
    setKeyInput('');
    setValueInput('');

    const placement = resolveKeyPlacement(nextEntry, sortedVnodes, replicationFactor);
    const targetDesc = placement.primaryNodeId
      ? `primary ${placement.primaryNodeId}${
          placement.replicaNodeIds.length > 0
            ? ` and replicas [${placement.replicaNodeIds.join(', ')}]`
            : ''
        }`
      : 'no active node (cluster offline)';
    onAnnounce(
      placement.primaryNodeId ? 'success' : 'warning',
      `${exists ? 'Updated' : 'Inserted'} key "${k}" (${hashToHex(nextEntry.hash)}) mapped to ${targetDesc}.`
    );
  };

  const handleDeleteKey = (keyToRemove: string) => {
    const updated = entries.filter((item) => item.key !== keyToRemove);
    onChangeEntries(updated);
    if (selectedKeyName === keyToRemove) {
      setSelectedKeyName(updated[0]?.key ?? null);
    }
    onAnnounce('info', `Removed key "${keyToRemove}" from the consistent hash ring.`);
  };

  const handleToggleNodeStatus = (nodeId: string) => {
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    const nextStatus: 'healthy' | 'offline' =
      target.status === 'healthy' ? 'offline' : 'healthy';
    const updatedNodes: RingNode[] = nodes.map((n) =>
      n.id === nodeId ? { ...n, status: nextStatus } : n
    );
    onChangeNodes(updatedNodes);
    onAnnounce(
      nextStatus === 'offline' ? 'warning' : 'success',
      nextStatus === 'offline'
        ? `${nodeId} marked Offline. Keys automatically re-routed clockwise to healthy successors.`
        : `${nodeId} recovered to Healthy status. Virtual nodes rejoined the ring.`
    );
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newNodeLabel.trim();
    if (!label) {
      setNodeError('Provide a node name (for example, "Node E (sa-east)") to add a node.');
      return;
    }
    setNodeError(null);
    const nextIndex = nodes.length + 1;
    const id = `Node-${String.fromCharCode(64 + nextIndex)}`;
    const newNode: RingNode = {
      id,
      label,
      zone: `Zone ${nextIndex}`,
      status: 'healthy',
      vnodes: 8,
    };
    onChangeNodes([...nodes, newNode]);
    setNewNodeLabel('');
    onAnnounce('success', `Added ${id} (${label}) with 8 virtual nodes to the ring.`);
  };

  const handleSvgKeyNavigation = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (placements.length === 0) return;
    const currentIdx = placements.findIndex(
      (p) => p.entry.key === selectedPlacement?.entry.key
    );
    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (currentIdx + 1) % placements.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (currentIdx - 1 + placements.length) % placements.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = placements.length - 1;
    } else {
      return;
    }
    const chosen = placements[nextIdx];
    setSelectedKeyName(chosen.entry.key);
    onAnnounce(
      'info',
      `Selected key "${chosen.entry.key}" at ${Math.round(chosen.entry.angleDeg)} degrees on ${chosen.primaryNodeId ?? 'unassigned'}.`
    );
  };

  return (
    <section aria-labelledby="ring-heading" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[var(--border-hairline)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-md">
          <h1 id="ring-heading" className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Consistent Hash Sharding
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            32-bit FNV-1a placement for both distributed graph nodes and stored keys across virtual nodes.
          </p>
        </div>

        {/* Summary metrics strip with tabular figures */}
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-2 pr-1 text-sm">
          <div className="whitespace-nowrap">
            <dt className="text-xs text-[var(--text-muted)]">Healthy Nodes</dt>
            <dd className="font-mono text-base font-semibold tabular-nums text-[var(--text-primary)]">
              {metrics.healthyNodeCount}/{nodes.length}
            </dd>
          </div>
          <div className="whitespace-nowrap">
            <dt className="text-xs text-[var(--text-muted)]">Virtual Nodes</dt>
            <dd className="font-mono text-base font-semibold tabular-nums text-[var(--text-primary)]">
              {metrics.totalVnodes}
            </dd>
          </div>
          <div className="whitespace-nowrap">
            <dt className="text-xs text-[var(--text-muted)]">Keys Stored</dt>
            <dd className="font-mono text-base font-semibold tabular-nums text-[var(--text-primary)]">
              {metrics.totalKeys}
            </dd>
          </div>
          <div className="whitespace-nowrap">
            <dt className="text-xs text-[var(--text-muted)]">Load Std Dev</dt>
            <dd className="font-mono text-base font-semibold tabular-nums text-[var(--text-primary)]">
              {metrics.keyBalanceStdDev}
            </dd>
          </div>
        </dl>
      </div>

      {/* Main Stage Grid: Ring Diagram + Key/Node Forms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Interactive Accessible Ring SVG */}
        <div className="lg:col-span-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Ring Topology (0x00000000 to 0xFFFFFFFF)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Use ArrowLeft and ArrowRight keys inside the ring region to step through keys.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="rf-select" className="text-xs font-medium text-[var(--text-secondary)]">
                Replication Factor (N)
              </label>
              <select
                id="rf-select"
                value={replicationFactor}
                onChange={(e) => {
                  const nextRf = Number(e.target.value);
                  onChangeReplicationFactor(nextRf);
                  onAnnounce('info', `Updated ring replication factor to N=${nextRf}.`);
                }}
                className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs font-mono font-semibold text-[var(--text-primary)]"
              >
                <option value={1}>N = 1</option>
                <option value={2}>N = 2</option>
                <option value={3}>N = 3</option>
              </select>
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Consistent hash ring interactive diagram. Use Left and Right arrow keys to inspect placed keys."
            onKeyDown={handleSvgKeyNavigation}
            className="mt-4 flex flex-col items-center rounded-lg bg-[var(--bg-subtle)] p-4 focus-visible:outline-3"
          >
            <svg
              viewBox="0 0 380 380"
              className="h-72 w-72 sm:h-80 sm:w-80"
              role="img"
              aria-label={`Hash ring displaying ${sortedVnodes.length} virtual nodes and ${entries.length} keys`}
            >
              {/* Ring circumference */}
              <circle
                cx="190"
                cy="190"
                r="128"
                fill="none"
                stroke="var(--border-hairline)"
                strokeWidth="3"
              />
              {/* 4 cardinal hash markers */}
              {[0, 90, 180, 270].map((deg) => {
                const pos = polarToCartesian(190, 190, 162, deg);
                const label =
                  deg === 0
                    ? '0x0000'
                    : deg === 90
                      ? '0x4000'
                      : deg === 180
                        ? '0x8000'
                        : '0xC000';
                return (
                  <text
                    key={deg}
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-[var(--text-muted)] text-[10px] font-mono"
                  >
                    {label}
                  </text>
                );
              })}

              {/* Virtual node markers */}
              {sortedVnodes.map((vn) => {
                const pt = polarToCartesian(190, 190, 128, vn.angleDeg);
                const color = nodeColorMap[vn.nodeId] ?? '#0284c7';
                return (
                  <g key={vn.vnodeId}>
                    <title>{`${vn.vnodeId} (${hashToHex(vn.hash)})`}</title>
                    <rect
                      x={pt.x - 5}
                      y={pt.y - 5}
                      width="10"
                      height="10"
                      rx="2"
                      fill={color}
                      stroke="var(--bg-surface)"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* Key markers */}
              {placements.map((p) => {
                const pt = polarToCartesian(190, 190, 102, p.entry.angleDeg);
                const isSelected = selectedPlacement?.entry.key === p.entry.key;
                const primaryColor = p.primaryNodeId
                  ? nodeColorMap[p.primaryNodeId] ?? '#0284c7'
                  : '#dc2626';
                return (
                  <g
                    key={p.entry.key}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedKeyName(p.entry.key);
                      onAnnounce(
                        'info',
                        `Selected key "${p.entry.key}" stored on ${p.primaryNodeId ?? 'none'}.`
                      );
                    }}
                  >
                    <title>{`Key ${p.entry.key} = ${p.entry.value} (Primary: ${p.primaryNodeId ?? 'Offline'})`}</title>
                    {isSelected && (
                      <line
                        x1="190"
                        y1="190"
                        x2={pt.x}
                        y2={pt.y}
                        stroke={primaryColor}
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 7.5 : 5.5}
                      fill={isSelected ? 'var(--accent-primary)' : primaryColor}
                      stroke="var(--bg-surface)"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {/* Center readout */}
              <text
                x="190"
                y="182"
                textAnchor="middle"
                className="fill-[var(--text-primary)] text-xs font-semibold"
              >
                {selectedPlacement ? selectedPlacement.entry.key : 'No Keys'}
              </text>
              <text
                x="190"
                y="200"
                textAnchor="middle"
                className="fill-[var(--text-muted)] text-[11px] font-mono"
              >
                {selectedPlacement
                  ? `Primary: ${selectedPlacement.primaryNodeId ?? 'None'}`
                  : 'Insert a key'}
              </text>
            </svg>

            {/* Selected Key Inspector strip */}
            {selectedPlacement && (
              <div className="mt-3 w-full border-t border-[var(--border-hairline)] pt-3 text-xs text-[var(--text-secondary)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Selected: <strong className="font-mono text-[var(--text-primary)]">{selectedPlacement.entry.key}</strong>
                    <span aria-hidden="true"> · </span>
                    Value: <span className="font-mono">{selectedPlacement.entry.value}</span>
                  </span>
                  <span className="font-mono">
                    {hashToHex(selectedPlacement.entry.hash)} ({Math.round(selectedPlacement.entry.angleDeg)}°)
                  </span>
                </div>
                <p className="mt-1">
                  Preference List:{' '}
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {selectedPlacement.allAssignedNodeIds.length > 0
                      ? selectedPlacement.allAssignedNodeIds.join(' -> ')
                      : 'Cluster offline (no reachable nodes)'}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Key Insertion + Node Control */}
        <div className="lg:col-span-5 space-y-6">
          {/* Insert / Update Key Form */}
          <form
            onSubmit={handleInsertKey}
            noValidate
            className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
          >
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Put Key onto Ring
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Hashes the key to 32-bit ring coordinates and replicates to N clockwise physical nodes.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="ring-key-input"
                  className="block text-xs font-medium text-[var(--text-secondary)]"
                >
                  Key Identifier
                </label>
                <input
                  id="ring-key-input"
                  type="text"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. session:901"
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label
                  htmlFor="ring-val-input"
                  className="block text-xs font-medium text-[var(--text-secondary)]"
                >
                  Payload Value
                </label>
                <input
                  ref={valInputRef}
                  id="ring-val-input"
                  type="text"
                  value={valueInput}
                  onChange={(e) => {
                    setValueInput(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. active"
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            {formError && (
              <p role="alert" className="mt-2.5 text-xs font-medium text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Insert Key</span>
            </button>
          </form>

          {/* Physical Node Cluster Manager */}
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Cluster Nodes
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Simulate node failure or add capacity to watch consistent key remapping.
            </p>

            <ul className="mt-3 divide-y divide-[var(--border-hairline)]">
              {nodes.map((node) => {
                const isHealthy = node.status === 'healthy';
                const primaryCount = placements.filter(
                  (p) => p.primaryNodeId === node.id
                ).length;
                return (
                  <li key={node.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: nodeColorMap[node.id] }}
                        />
                        <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {node.label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            isHealthy
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-red-700 dark:text-red-400'
                          }`}
                        >
                          {isHealthy ? (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{isHealthy ? 'Healthy' : 'Offline'}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{primaryCount} primary keys</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNodeStatus(node.id)}
                      aria-label={isHealthy ? `Fail ${node.id}` : `Recover ${node.id}`}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isHealthy ? (
                        <>
                          <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Fail Node</span>
                        </>
                      ) : (
                        <>
                          <Power className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Recover</span>
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <form onSubmit={handleAddNode} noValidate className="mt-4 border-t border-[var(--border-hairline)] pt-3">
              <label htmlFor="new-node-input" className="block text-xs font-medium text-[var(--text-secondary)]">
                Add Physical Node
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="new-node-input"
                  type="text"
                  value={newNodeLabel}
                  onChange={(e) => {
                    setNewNodeLabel(e.target.value);
                    if (nodeError) setNodeError(null);
                  }}
                  placeholder="e.g. Node E (sa-east)"
                  className="min-h-[40px] flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
                <button
                  type="submit"
                  className="min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Add Node
                </button>
              </div>
              {nodeError && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  {nodeError}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Accessible Key Placement Table (Screen-reader & keyboard companion to the ring) */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Accessible Key Placement Directory
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Complete tabular mapping of all keys, 32-bit hashes, primary owners, and replica nodes.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <label htmlFor="ring-key-search" className="sr-only">
              Filter keys by identifier, value, or node
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <input
              id="ring-key-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter keys or nodes..."
              className="w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)]"
            />
          </div>
        </div>

        {filteredPlacements.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[var(--border-hairline)] p-6 text-center text-sm text-[var(--text-muted)]">
            {entries.length === 0
              ? 'The hash ring currently stores zero keys. Use the Put Key form above to insert your first key.'
              : `No keys match "${searchQuery}".`}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-muted)]">
                  <th scope="col" className="py-2.5 pr-4">Key</th>
                  <th scope="col" className="py-2.5 pr-4">Value</th>
                  <th scope="col" className="py-2.5 pr-4">32-Bit Hash</th>
                  <th scope="col" className="py-2.5 pr-4">Primary Node</th>
                  <th scope="col" className="py-2.5 pr-4">Replicas</th>
                  <th scope="col" className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {filteredPlacements.map((p) => {
                  const isSelected = selectedPlacement?.entry.key === p.entry.key;
                  return (
                    <tr
                      key={p.entry.key}
                      className={isSelected ? 'bg-[var(--bg-subtle)]' : 'hover:bg-[var(--bg-subtle)]/50'}
                    >
                      <td className="py-2.5 pr-4 font-mono font-semibold text-[var(--text-primary)]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKeyName(p.entry.key);
                            onAnnounce('info', `Focused key "${p.entry.key}" on ring.`);
                          }}
                          className="text-left hover:underline cursor-pointer"
                        >
                          {p.entry.key}
                        </button>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-secondary)]">
                        {p.entry.value}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {hashToHex(p.entry.hash)}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-[var(--text-primary)]">
                        {p.primaryNodeId ?? 'Unassigned (Offline)'}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-secondary)]">
                        {p.replicaNodeIds.length > 0 ? p.replicaNodeIds.join(', ') : 'None'}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKeyName(p.entry.key);
                            setKeyInput(p.entry.key);
                            setValueInput(p.entry.value);
                            setFormError(null);
                            onAnnounce(
                              'info',
                              `Loaded ring key "${p.entry.key}" into Put Key editor.`
                            );
                            setTimeout(() => valInputRef.current?.focus(), 0);
                          }}
                          aria-label={`Edit key ${p.entry.key}`}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border-hairline)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteKey(p.entry.key)}
                          aria-label={`Delete key ${p.entry.key}`}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border-hairline)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Distributed Graph Node Hash Routing */}
      {graphNodes.length > 0 && (
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Live Distributed Graph Node Ring Placement ({graphNodes.length} graph nodes)
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Shows each live graph node&apos;s logical shard alongside its 32-bit ring owner and clockwise replicas.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                  <th scope="col" className="py-2 pr-3">Graph Node</th>
                  <th scope="col" className="py-2 pr-3">Assigned Shard</th>
                  <th scope="col" className="py-2 pr-3">32-Bit Hash</th>
                  <th scope="col" className="py-2 pr-3">Primary Ring Host</th>
                  <th scope="col" className="py-2">Clockwise Replicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {graphNodes.map((gn) => {
                  const placement = resolveKeyPlacement(
                    createKeyEntry(`graph:${gn.id}`, gn.label),
                    sortedVnodes,
                    replicationFactor
                  );
                  return (
                    <tr key={gn.id}>
                      <td className="py-2 pr-3 font-semibold text-[var(--text-primary)]">
                        <span className="font-mono">{gn.id}</span> · {gn.label}
                      </td>
                      <td className="py-2 pr-3 font-mono text-[var(--text-secondary)]">
                        {gn.shard}
                      </td>
                      <td className="py-2 pr-3 font-mono tabular-nums text-[var(--text-muted)]">
                        {hashToHex(placement.entry.hash)}
                      </td>
                      <td className="py-2 pr-3 font-mono font-semibold text-[var(--text-primary)]">
                        {placement.primaryNodeId ?? 'Offline'}
                      </td>
                      <td className="py-2 font-mono text-[var(--text-secondary)]">
                        {placement.replicaNodeIds.length > 0
                          ? placement.replicaNodeIds.join(', ')
                          : 'None'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
