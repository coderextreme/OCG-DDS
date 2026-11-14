import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Layers,
  Play,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  attenuateCapability,
  executeGraphBatch,
  isCapabilityActive,
  queryGraph,
  revokeCapability,
  type BatchOperation,
  type CapabilityRight,
  type CapabilityScope,
  type CapabilityToken,
  type GraphArc,
  type GraphEntityStatus,
  type GraphNode,
  type GraphQuery,
} from '../core/ocapGraph';

interface GraphOcapViewProps {
  nodes: GraphNode[];
  arcs: GraphArc[];
  capabilities: CapabilityToken[];
  activeCapabilityId: string;
  brailleMode: boolean;
  onUpdateGraph: (nodes: GraphNode[], arcs: GraphArc[]) => void;
  onUpdateCapabilities: (caps: CapabilityToken[], activeId: string) => void;
  onAnnounce: (severity: 'info' | 'warning' | 'success', summary: string) => void;
}

const ALL_RIGHTS: CapabilityRight[] = [
  'read',
  'create',
  'update',
  'delete',
  'batch',
  'delegate',
  'revoke',
];

const SHARD_COLORS: Record<GraphNode['shard'], string> = {
  'Shard-A': '#0284c7',
  'Shard-B': '#059669',
  'Shard-C': '#d97706',
};

export const GraphOcapView: React.FC<GraphOcapViewProps> = ({
  nodes,
  arcs,
  capabilities,
  activeCapabilityId,
  brailleMode,
  onUpdateGraph,
  onUpdateCapabilities,
  onAnnounce,
}) => {
  // Selection Groups
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(['N1', 'N2']);
  const [selectedArcIds, setSelectedArcIds] = useState<string[]>(['A1']);
  const [focusedNodeId, setFocusedNodeId] = useState<string>(nodes[0]?.id ?? 'N1');

  // Query state
  const [query, setQuery] = useState<GraphQuery>({
    text: '',
    shard: 'all',
    status: 'all',
    groupTag: '',
    minWeight: null,
    reachableFromNodeId: '',
  });

  // Create Node form
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeShard, setNewNodeShard] = useState<GraphNode['shard']>('Shard-B');
  const [newNodeGroup, setNewNodeGroup] = useState('edge');

  // Create Arc form
  const [newArcId, setNewArcId] = useState('');
  const [newArcSource, setNewArcSource] = useState(nodes[0]?.id ?? 'N1');
  const [newArcTarget, setNewArcTarget] = useState(nodes[1]?.id ?? 'N2');
  const [newArcLabel, setNewArcLabel] = useState('');
  const [newArcWeight, setNewArcWeight] = useState('10');
  const [newArcGroup, setNewArcGroup] = useState('data');

  // Group Update form
  const [groupTargetStatus, setGroupTargetStatus] =
    useState<GraphEntityStatus>('maintenance');
  const [groupTargetShard, setGroupTargetShard] =
    useState<GraphNode['shard']>('Shard-B');
  const [groupArcWeight, setGroupArcWeight] = useState('15');
  const [groupTagPatch, setGroupTagPatch] = useState('');

  // Batch Queue
  const [batchQueue, setBatchQueue] = useState<BatchOperation[]>([]);
  const [opFeedback, setOpFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  // OCap Attenuation form
  const [attParentId, setAttParentId] = useState(activeCapabilityId);
  const [attLabel, setAttLabel] = useState('');
  const [attHolder, setAttHolder] = useState('');
  const [attScope, setAttScope] = useState<CapabilityScope>('Shard-B');
  const [attRights, setAttRights] = useState<CapabilityRight[]>(['read', 'update']);
  const [ocapFeedback, setOcapFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const activeCap = useMemo(
    () => capabilities.find((c) => c.id === activeCapabilityId) ?? capabilities[0],
    [capabilities, activeCapabilityId]
  );

  const activeCapValid = useMemo(
    () => (activeCap ? isCapabilityActive(activeCap.id, capabilities) : false),
    [activeCap, capabilities]
  );

  const hasReadRight = useMemo(
    () => activeCapValid && activeCap?.rights.includes('read'),
    [activeCapValid, activeCap]
  );

  const queryResult = useMemo(() => queryGraph(nodes, arcs, query), [nodes, arcs, query]);
  const matchedNodeSet = useMemo(
    () => new Set(queryResult.nodes.map((n) => n.id)),
    [queryResult.nodes]
  );
  const matchedArcSet = useMemo(
    () => new Set(queryResult.arcs.map((a) => a.id)),
    [queryResult.arcs]
  );

  const selectedNodeSet = useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);
  const selectedArcSet = useMemo(() => new Set(selectedArcIds), [selectedArcIds]);

  const runImmediateOps = (ops: BatchOperation[], successMsg: string) => {
    const res = executeGraphBatch(
      nodes,
      arcs,
      ops,
      activeCapabilityId,
      capabilities
    );
    if (!res.ok) {
      const errText = res.error ?? 'Operation denied.';
      setOpFeedback({ type: 'error', text: errText });
      onAnnounce('warning', errText);
      return false;
    }
    onUpdateGraph(res.nodes, res.arcs);
    setOpFeedback({ type: 'success', text: successMsg });
    onAnnounce('success', successMsg);
    return true;
  };

  const buildCreateNodeOp = (): { op?: BatchOperation; error?: string } => {
    const id = newNodeId.trim();
    const label = newNodeLabel.trim();
    if (!id || !label) {
      return { error: 'Node ID and Label are required to create a node.' };
    }
    const candidates: Array<{ x: number; y: number }> = [
      { x: 90, y: 205 },
      { x: 170, y: 140 },
      { x: 340, y: 70 },
      { x: 340, y: 225 },
      { x: 170, y: 240 },
      { x: 440, y: 65 },
    ];
    let chosen = candidates[nodes.length % candidates.length];
    for (const c of candidates) {
      const collides = nodes.some((n) => Math.hypot(n.x - c.x, n.y - c.y) < 58);
      if (!collides) {
        chosen = c;
        break;
      }
    }
    return {
      op: {
        id: `op-cn-${Date.now()}`,
        kind: 'create-node',
        node: {
          id,
          label,
          shard: newNodeShard,
          status: 'active',
          groupTag: newNodeGroup.trim() || 'general',
          x: chosen.x,
          y: chosen.y,
        },
      },
    };
  };

  const buildCreateArcOp = (): { op?: BatchOperation; error?: string } => {
    const id = newArcId.trim();
    const label = newArcLabel.trim();
    const weight = Number(newArcWeight);
    if (!id || !label) {
      return { error: 'Arc ID and Label are required to create an arc.' };
    }
    if (!Number.isFinite(weight) || weight < 0) {
      return { error: 'Arc weight must be a non-negative number.' };
    }
    return {
      op: {
        id: `op-ca-${Date.now()}`,
        kind: 'create-arc',
        arc: {
          id,
          source: newArcSource,
          target: newArcTarget,
          label,
          weight,
          status: 'active',
          groupTag: newArcGroup.trim() || 'data',
        },
      },
    };
  };

  const handleCreateNode = (queueOnly: boolean) => {
    const built = buildCreateNodeOp();
    if (built.error || !built.op) {
      setOpFeedback({ type: 'error', text: built.error ?? 'Invalid node input.' });
      return;
    }
    if (queueOnly) {
      setBatchQueue((prev) => [...prev, built.op!]);
      setOpFeedback({ type: 'success', text: `Queued creation of node ${newNodeId.trim()}.` });
      onAnnounce('info', `Queued node ${newNodeId.trim()} into batch.`);
      setNewNodeId('');
      setNewNodeLabel('');
    } else if (
      runImmediateOps(
        [built.op],
        `Created node ${newNodeId.trim()} (${newNodeLabel.trim()}) on ${newNodeShard}.`
      )
    ) {
      setNewNodeId('');
      setNewNodeLabel('');
    }
  };

  const handleCreateArc = (queueOnly: boolean) => {
    const built = buildCreateArcOp();
    if (built.error || !built.op) {
      setOpFeedback({ type: 'error', text: built.error ?? 'Invalid arc input.' });
      return;
    }
    if (queueOnly) {
      setBatchQueue((prev) => [...prev, built.op!]);
      setOpFeedback({ type: 'success', text: `Queued creation of arc ${newArcId.trim()}.` });
      onAnnounce('info', `Queued arc ${newArcId.trim()} into batch.`);
      setNewArcId('');
      setNewArcLabel('');
    } else if (
      runImmediateOps(
        [built.op],
        `Created arc ${newArcId.trim()} (${newArcSource} -> ${newArcTarget}).`
      )
    ) {
      setNewArcId('');
      setNewArcLabel('');
    }
  };

  const handleGroupStatusUpdate = (queueOnly: boolean) => {
    if (selectedNodeIds.length === 0 && selectedArcIds.length === 0) {
      setOpFeedback({
        type: 'error',
        text: 'Select at least one node or arc in a group before applying a group update.',
      });
      return;
    }
    const ops: BatchOperation[] = [];
    if (selectedNodeIds.length > 0) {
      ops.push({
        id: `op-un-${Date.now()}`,
        kind: 'update-nodes',
        nodeIds: [...selectedNodeIds],
        patch: {
          status: groupTargetStatus,
          shard: groupTargetShard,
          ...(groupTagPatch.trim() ? { groupTag: groupTagPatch.trim() } : {}),
        },
      });
    }
    if (selectedArcIds.length > 0) {
      const parsedWeight = Number(groupArcWeight);
      ops.push({
        id: `op-ua-${Date.now() + 1}`,
        kind: 'update-arcs',
        arcIds: [...selectedArcIds],
        patch: {
          status: groupTargetStatus,
          ...(Number.isFinite(parsedWeight) && parsedWeight >= 0
            ? { weight: parsedWeight }
            : {}),
          ...(groupTagPatch.trim() ? { groupTag: groupTagPatch.trim() } : {}),
        },
      });
    }

    if (queueOnly) {
      setBatchQueue((prev) => [...prev, ...ops]);
      setOpFeedback({
        type: 'success',
        text: `Queued ${ops.length} group update operation(s) for ${selectedNodeIds.length} node(s) and ${selectedArcIds.length} arc(s).`,
      });
      onAnnounce('info', `Added group update to batch queue.`);
    } else {
      runImmediateOps(
        ops,
        `Updated ${selectedNodeIds.length} node(s) and ${selectedArcIds.length} arc(s) to status "${groupTargetStatus}".`
      );
    }
  };

  const handleGroupDelete = (queueOnly: boolean) => {
    if (selectedNodeIds.length === 0 && selectedArcIds.length === 0) {
      setOpFeedback({
        type: 'error',
        text: 'Select at least one node or arc in a group before deleting.',
      });
      return;
    }
    const ops: BatchOperation[] = [];
    if (selectedArcIds.length > 0) {
      ops.push({
        id: `op-da-${Date.now()}`,
        kind: 'delete-arcs',
        arcIds: [...selectedArcIds],
      });
    }
    if (selectedNodeIds.length > 0) {
      ops.push({
        id: `op-dn-${Date.now() + 1}`,
        kind: 'delete-nodes',
        nodeIds: [...selectedNodeIds],
      });
    }

    if (queueOnly) {
      setBatchQueue((prev) => [...prev, ...ops]);
      setOpFeedback({
        type: 'success',
        text: `Queued deletion for ${selectedNodeIds.length} node(s) and ${selectedArcIds.length} arc(s).`,
      });
      onAnnounce('info', 'Added group deletion to batch queue.');
    } else if (
      runImmediateOps(
        ops,
        `Deleted ${selectedNodeIds.length} node(s) and ${selectedArcIds.length} arc(s) from the distributed graph.`
      )
    ) {
      setSelectedNodeIds([]);
      setSelectedArcIds([]);
    }
  };

  const handleExecuteBatch = () => {
    const res = executeGraphBatch(
      nodes,
      arcs,
      batchQueue,
      activeCapabilityId,
      capabilities
    );
    if (!res.ok) {
      const errText = res.error ?? 'Batch execution failed.';
      setOpFeedback({ type: 'error', text: errText });
      onAnnounce('warning', errText);
      return;
    }
    onUpdateGraph(res.nodes, res.arcs);
    setBatchQueue([]);
    const existingNodeIds = new Set(res.nodes.map((n) => n.id));
    const existingArcIds = new Set(res.arcs.map((a) => a.id));
    setSelectedNodeIds((prev) => prev.filter((id) => existingNodeIds.has(id)));
    setSelectedArcIds((prev) => prev.filter((id) => existingArcIds.has(id)));
    setOpFeedback({ type: 'success', text: res.summary });
    onAnnounce('success', res.summary);
  };

  const handleAttenuateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attLabel.trim() || !attHolder.trim()) {
      setOcapFeedback({
        type: 'error',
        text: 'Token label and holder name are required to mint an attenuated capability.',
      });
      return;
    }
    const newId = `cap-${Date.now().toString(36).slice(-4)}`;
    const result = attenuateCapability(attParentId, capabilities, {
      id: newId,
      label: attLabel,
      holder: attHolder,
      rights: attRights,
      scope: attScope,
    });
    if (!result.ok) {
      setOcapFeedback({ type: 'error', text: result.error });
      onAnnounce('warning', result.error);
      return;
    }
    onUpdateCapabilities([...capabilities, result.token], activeCapabilityId);
    setAttLabel('');
    setAttHolder('');
    const msg = `Minted attenuated capability "${result.token.label}" (${result.token.id}) scoped to ${result.token.scope}.`;
    setOcapFeedback({ type: 'success', text: msg });
    onAnnounce('success', msg);
  };

  const handleRevokeCap = (targetId: string) => {
    const res = revokeCapability(capabilities, targetId, activeCapabilityId);
    if (!res.ok) {
      setOcapFeedback({ type: 'error', text: res.error });
      onAnnounce('warning', res.error);
      return;
    }
    onUpdateCapabilities(res.caps, activeCapabilityId);
    const msg = `Revoked capability ${targetId} and invalidated any attenuated descendant tokens.`;
    setOcapFeedback({ type: 'success', text: msg });
    onAnnounce('warning', msg);
  };

  const handleSvgKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (nodes.length === 0) return;
    const idx = nodes.findIndex((n) => n.id === focusedNodeId);
    let nextIdx = idx < 0 ? 0 : idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (nextIdx + 1) % nodes.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (nextIdx - 1 + nodes.length) % nodes.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = nodes.length - 1;
    } else {
      return;
    }
    const chosen = nodes[nextIdx];
    setFocusedNodeId(chosen.id);
    onAnnounce(
      'info',
      `Focused node ${chosen.id} (${chosen.label}) in ${chosen.shard}, status ${chosen.status}.`
    );
  };

  const describeBatchOp = (op: BatchOperation): string => {
    switch (op.kind) {
      case 'create-node':
        return `Create Node ${op.node.id} (${op.node.label}, ${op.node.shard})`;
      case 'create-arc':
        return `Create Arc ${op.arc.id} (${op.arc.source} -> ${op.arc.target}, w=${op.arc.weight})`;
      case 'update-nodes':
        return `Update ${op.nodeIds.length} node(s) [${op.nodeIds.join(', ')}]`;
      case 'delete-nodes':
        return `Delete ${op.nodeIds.length} node(s) [${op.nodeIds.join(', ')}]`;
      case 'update-arcs':
        return `Update ${op.arcIds.length} arc(s) [${op.arcIds.join(', ')}]`;
      case 'delete-arcs':
        return `Delete ${op.arcIds.length} arc(s) [${op.arcIds.join(', ')}]`;
    }
  };

  return (
    <section aria-labelledby="graph-ocap-heading" className="space-y-6">
      {/* Header + Active Object-Capability Token Switcher */}
      <div className="flex flex-col gap-4 border-b border-[var(--border-hairline)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-xl">
          <h1 id="graph-ocap-heading" className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Distributed Graph and Object-Capability Security
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Create, query, group-select, and batch-mutate nodes and directed arcs under attenuated capability tokens.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 shrink-0">
          <div>
            <label
              htmlFor="active-cap-select"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Active Capability Token
            </label>
            <select
              id="active-cap-select"
              value={activeCapabilityId}
              onChange={(e) => {
                const nextId = e.target.value;
                onUpdateCapabilities(capabilities, nextId);
                const chosen = capabilities.find((c) => c.id === nextId);
                onAnnounce(
                  'info',
                  `Active capability switched to ${chosen?.label ?? nextId} (scope: ${chosen?.scope ?? 'unknown'}).`
                );
              }}
              className="mt-1 min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)]"
            >
              {capabilities.map((c) => {
                const active = isCapabilityActive(c.id, capabilities);
                return (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.scope}) {active ? '' : '[REVOKED]'}
                  </option>
                );
              })}
            </select>
          </div>

          <div
            className={`inline-flex min-h-[40px] items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
              activeCapValid
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {activeCapValid ? (
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {activeCapValid
                ? `Rights: ${activeCap?.rights.join(', ')}`
                : 'Token Revoked'}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Banner (Assertive for capability denials / errors) */}
      {opFeedback && (
        <div
          role={opFeedback.type === 'error' ? 'alert' : 'status'}
          aria-live={opFeedback.type === 'error' ? 'assertive' : 'polite'}
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            opFeedback.type === 'error'
              ? 'border-red-500/50 bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200'
              : 'border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
          }`}
        >
          {opFeedback.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{opFeedback.text}</span>
        </div>
      )}

      {/* Query & Group Selection Controls */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Query, Find, and Group-Select Nodes and Arcs
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Filter by identifier, shard, status, arc weight, or graph reachability, then select matching entities as a group.
            </p>
          </div>
          <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
            Matched: {queryResult.nodes.length}/{nodes.length} nodes · {queryResult.arcs.length}/{arcs.length} arcs
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label htmlFor="graph-query-text" className="block text-xs font-medium text-[var(--text-secondary)]">
              Find by ID, Label, or Tag
            </label>
            <div className="relative mt-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <input
                id="graph-query-text"
                type="search"
                value={query.text}
                onChange={(e) => setQuery((q) => ({ ...q, text: e.target.value }))}
                placeholder="e.g. N1, Ledger, verify..."
                className="w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] pl-8 pr-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="graph-query-shard" className="block text-xs font-medium text-[var(--text-secondary)]">
              Shard
            </label>
            <select
              id="graph-query-shard"
              value={query.shard}
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  shard: e.target.value as GraphQuery['shard'],
                }))
              }
              className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="all">All Shards</option>
              <option value="Shard-A">Shard-A</option>
              <option value="Shard-B">Shard-B</option>
              <option value="Shard-C">Shard-C</option>
            </select>
          </div>

          <div>
            <label htmlFor="graph-query-status" className="block text-xs font-medium text-[var(--text-secondary)]">
              Status
            </label>
            <select
              id="graph-query-status"
              value={query.status}
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  status: e.target.value as GraphQuery['status'],
                }))
              }
              className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="isolated">Isolated</option>
            </select>
          </div>

          <div>
            <label htmlFor="graph-query-weight" className="block text-xs font-medium text-[var(--text-secondary)]">
              Min Arc Weight
            </label>
            <input
              id="graph-query-weight"
              type="number"
              min={0}
              value={query.minWeight ?? ''}
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  minWeight: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
              placeholder="Any"
              className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label htmlFor="graph-query-reach" className="block text-xs font-medium text-[var(--text-secondary)]">
              Reachable From
            </label>
            <select
              id="graph-query-reach"
              value={query.reachableFromNodeId}
              onChange={(e) =>
                setQuery((q) => ({ ...q, reachableFromNodeId: e.target.value }))
              }
              className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="">Any Node</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.id} · {n.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Group selection actions */}
        <div className="flex flex-wrap items-center gap-2.5 border-t border-[var(--border-hairline)] pt-3">
          <button
            type="button"
            onClick={() => {
              const ids = queryResult.nodes.map((n) => n.id);
              setSelectedNodeIds(ids);
              onAnnounce('info', `Selected ${ids.length} matched node(s) as active group.`);
            }}
            className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
          >
            Select Matched Nodes ({queryResult.nodes.length})
          </button>
          <button
            type="button"
            onClick={() => {
              const ids = queryResult.arcs.map((a) => a.id);
              setSelectedArcIds(ids);
              onAnnounce('info', `Selected ${ids.length} matched arc(s) as active group.`);
            }}
            className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
          >
            Select Matched Arcs ({queryResult.arcs.length})
          </button>
          <button
            type="button"
            onClick={() => {
              const incident = arcs
                .filter(
                  (a) =>
                    selectedNodeSet.has(a.source) || selectedNodeSet.has(a.target)
                )
                .map((a) => a.id);
              setSelectedArcIds(incident);
              onAnnounce('info', `Selected ${incident.length} incident arc(s) connected to chosen nodes.`);
            }}
            className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
          >
            Select Incident Arcs
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedNodeIds([]);
              setSelectedArcIds([]);
              onAnnounce('info', 'Cleared node and arc group selection.');
            }}
            className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            Clear Group
          </button>
          <span className="ml-auto font-mono text-xs text-[var(--text-muted)]">
            Selected Group: {selectedNodeIds.length} nodes · {selectedArcIds.length} arcs
          </span>
        </div>
      </div>

      {/* Topology Diagram + Linear Braille Adjacency + Batch & Group Action Deck */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Graph Topology SVG + Linear Braille-Ready Summary */}
        <div className="lg:col-span-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Distributed Graph Topology
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Use ArrowLeft and ArrowRight inside the diagram to inspect nodes, or use the accessible tables below.
              </p>
            </div>
          </div>

          {!hasReadRight ? (
            <div role="alert" className="rounded-lg bg-[var(--bg-subtle)] p-6 text-sm text-[var(--text-secondary)]">
              Active token lacks &quot;read&quot; authority or has been revoked. Switch to a valid capability token to inspect graph topology.
            </div>
          ) : (
            <>
              <div
                tabIndex={0}
                role="region"
                aria-label="Distributed graph topology diagram. Use Left and Right arrow keys to step through nodes."
                onKeyDown={handleSvgKeyDown}
                className="overflow-x-auto rounded-lg bg-[var(--bg-subtle)] p-3"
              >
                <svg
                  viewBox="0 0 520 290"
                  className="mx-auto h-64 w-full min-w-[460px]"
                  role="img"
                  aria-label={`Directed graph with ${nodes.length} nodes and ${arcs.length} arcs`}
                >
                  <defs>
                    <marker
                      id="arc-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--text-muted)" />
                    </marker>
                  </defs>

                  {/* Arcs */}
                  {arcs.map((arc) => {
                    const src = nodes.find((n) => n.id === arc.source);
                    const tgt = nodes.find((n) => n.id === arc.target);
                    if (!src || !tgt) return null;
                    const isMatched = matchedArcSet.has(arc.id);
                    const isSelected = selectedArcSet.has(arc.id);
                    const midX = (src.x + tgt.x) / 2;
                    const midY = (src.y + tgt.y) / 2 - 8;
                    return (
                      <g key={arc.id} opacity={isMatched ? 1 : 0.25}>
                        <title>{`Arc ${arc.id}: ${arc.source} -> ${arc.target} (${arc.label}, w=${arc.weight})`}</title>
                        <line
                          x1={src.x}
                          y1={src.y}
                          x2={tgt.x}
                          y2={tgt.y}
                          stroke={
                            isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'
                          }
                          strokeWidth={isSelected ? 3 : 1.75}
                          strokeDasharray={arc.status === 'maintenance' ? '5 4' : undefined}
                          markerEnd="url(#arc-arrow)"
                        />
                        <text
                          x={midX}
                          y={midY}
                          textAnchor="middle"
                          className="fill-[var(--text-primary)] text-[10px] font-mono font-semibold"
                        >
                          {arc.id}({arc.weight})
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map((node) => {
                    const isMatched = matchedNodeSet.has(node.id);
                    const isSelected = selectedNodeSet.has(node.id);
                    const isFocused = focusedNodeId === node.id;
                    return (
                      <g
                        key={node.id}
                        opacity={isMatched ? 1 : 0.3}
                        className="cursor-pointer"
                        onClick={() => {
                          setFocusedNodeId(node.id);
                          onAnnounce(
                            'info',
                            `Inspected node ${node.id} (${node.label}) in ${node.shard}.`
                          );
                        }}
                      >
                        <title>{`${node.id}: ${node.label} (${node.shard}, ${node.status})`}</title>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isFocused ? 23 : 20}
                          fill={SHARD_COLORS[node.shard]}
                          stroke={
                            isSelected
                              ? 'var(--text-primary)'
                              : 'var(--bg-surface)'
                          }
                          strokeWidth={isSelected ? 3.5 : 2}
                        />
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          className="fill-white text-[11px] font-mono font-bold"
                        >
                          {node.id}
                        </text>
                        <text
                          x={node.x}
                          y={node.y + 34}
                          textAnchor="middle"
                          className="fill-[var(--text-primary)] text-[10px] font-semibold"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Linear Deaf-Blind / Braille Adjacency Readout */}
              <div className="border-t border-[var(--border-hairline)] pt-3">
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                  Linear Adjacency Summary {brailleMode ? '(Braille-Compact)' : ''}
                </h3>
                <ul className="mt-2 space-y-1 font-mono text-xs text-[var(--text-secondary)]">
                  {queryResult.nodes.map((n) => {
                    const outgoing = queryResult.arcs.filter((a) => a.source === n.id);
                    const outText =
                      outgoing.length > 0
                        ? outgoing
                            .map((a) => `${a.id}:${a.label}(w=${a.weight})->${a.target}`)
                            .join(', ')
                        : 'no outgoing arcs';
                    return (
                      <li key={n.id}>
                        {n.id} [{n.shard}|{n.status}] :: {outText}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Right: Group Operations & Batch Queue */}
        <div className="lg:col-span-5 space-y-6">
          {/* Group Batch Mutation Panel */}
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Group Operations ({selectedNodeIds.length} Nodes · {selectedArcIds.length} Arcs)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Update or delete the selected node and arc group immediately or queue into an atomic batch.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="group-status-select" className="block text-xs font-medium text-[var(--text-secondary)]">
                  New Status
                </label>
                <select
                  id="group-status-select"
                  value={groupTargetStatus}
                  onChange={(e) => setGroupTargetStatus(e.target.value as GraphEntityStatus)}
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <option value="active">active</option>
                  <option value="maintenance">maintenance</option>
                  <option value="isolated">isolated</option>
                </select>
              </div>
              <div>
                <label htmlFor="group-shard-select" className="block text-xs font-medium text-[var(--text-secondary)]">
                  Node Shard
                </label>
                <select
                  id="group-shard-select"
                  value={groupTargetShard}
                  onChange={(e) => setGroupTargetShard(e.target.value as GraphNode['shard'])}
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <option value="Shard-A">Shard-A</option>
                  <option value="Shard-B">Shard-B</option>
                  <option value="Shard-C">Shard-C</option>
                </select>
              </div>
              <div>
                <label htmlFor="group-weight-input" className="block text-xs font-medium text-[var(--text-secondary)]">
                  Arc Weight
                </label>
                <input
                  id="group-weight-input"
                  type="number"
                  min={0}
                  value={groupArcWeight}
                  onChange={(e) => setGroupArcWeight(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label htmlFor="group-tag-input" className="block text-xs font-medium text-[var(--text-secondary)]">
                  Group Tag (Optional)
                </label>
                <input
                  id="group-tag-input"
                  type="text"
                  value={groupTagPatch}
                  onChange={(e) => setGroupTagPatch(e.target.value)}
                  placeholder="keep existing"
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleGroupStatusUpdate(false)}
                className="min-h-[40px] flex-1 rounded-lg bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] whitespace-nowrap cursor-pointer"
              >
                Update Group Now
              </button>
              <button
                type="button"
                onClick={() => handleGroupStatusUpdate(true)}
                className="min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] whitespace-nowrap cursor-pointer"
              >
                Queue Update
              </button>
              <button
                type="button"
                onClick={() => handleGroupDelete(false)}
                className="min-h-[40px] rounded-lg border border-red-500/50 px-3.5 py-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 whitespace-nowrap cursor-pointer"
              >
                Delete Group
              </button>
              <button
                type="button"
                onClick={() => handleGroupDelete(true)}
                className="min-h-[40px] rounded-lg border border-[var(--border-hairline)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap cursor-pointer"
              >
                Queue Delete
              </button>
            </div>
          </div>

          {/* Atomic Batch Execution Queue */}
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Batch Queue ({batchQueue.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBatchQueue([])}
                disabled={batchQueue.length === 0}
                className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Clear Queue
              </button>
            </div>

            {batchQueue.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--border-hairline)] p-4 text-xs text-[var(--text-muted)]">
                Queue is empty. Use &quot;Queue Node&quot;, &quot;Queue Arc&quot;, or &quot;Queue Update/Delete&quot; to compose an atomic multi-operation batch.
              </p>
            ) : (
              <ol className="space-y-1.5 text-xs font-mono">
                {batchQueue.map((op, idx) => (
                  <li
                    key={op.id}
                    className="flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-1.5 last:border-b-0"
                  >
                    <span className="truncate text-[var(--text-primary)]">
                      {idx + 1}. {describeBatchOp(op)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setBatchQueue((prev) => prev.filter((item) => item.id !== op.id))
                      }
                      aria-label={`Remove queued operation ${idx + 1}`}
                      className="text-[var(--text-muted)] hover:text-red-600 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            )}

            <button
              type="button"
              onClick={handleExecuteBatch}
              disabled={batchQueue.length === 0}
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>Execute Batch Atomically</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Node & Create Arc Forms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Create Node
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="create-node-id" className="block text-xs font-medium text-[var(--text-secondary)]">
                Node ID
              </label>
              <input
                id="create-node-id"
                type="text"
                value={newNodeId}
                onChange={(e) => setNewNodeId(e.target.value)}
                placeholder="e.g. N6"
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label htmlFor="create-node-label" className="block text-xs font-medium text-[var(--text-secondary)]">
                Node Label
              </label>
              <input
                id="create-node-label"
                type="text"
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                placeholder="e.g. Gateway EU"
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label htmlFor="create-node-shard" className="block text-xs font-medium text-[var(--text-secondary)]">
                Shard
              </label>
              <select
                id="create-node-shard"
                value={newNodeShard}
                onChange={(e) => setNewNodeShard(e.target.value as GraphNode['shard'])}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                <option value="Shard-A">Shard-A</option>
                <option value="Shard-B">Shard-B</option>
                <option value="Shard-C">Shard-C</option>
              </select>
            </div>
            <div>
              <label htmlFor="create-node-group" className="block text-xs font-medium text-[var(--text-secondary)]">
                Group Tag
              </label>
              <input
                id="create-node-group"
                type="text"
                value={newNodeGroup}
                onChange={(e) => setNewNodeGroup(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCreateNode(false)}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Create Node</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateNode(true)}
              className="min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              Queue Node
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Create Directed Arc
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="create-arc-id" className="block text-xs font-medium text-[var(--text-secondary)]">
                Arc ID
              </label>
              <input
                id="create-arc-id"
                type="text"
                value={newArcId}
                onChange={(e) => setNewArcId(e.target.value)}
                placeholder="e.g. A6"
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label htmlFor="create-arc-source" className="block text-xs font-medium text-[var(--text-secondary)]">
                Source Node
              </label>
              <select
                id="create-arc-source"
                value={newArcSource}
                onChange={(e) => setNewArcSource(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} ({n.label})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="create-arc-target" className="block text-xs font-medium text-[var(--text-secondary)]">
                Target Node
              </label>
              <select
                id="create-arc-target"
                value={newArcTarget}
                onChange={(e) => setNewArcTarget(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} ({n.label})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="create-arc-label" className="block text-xs font-medium text-[var(--text-secondary)]">
                Arc Label
              </label>
              <input
                id="create-arc-label"
                type="text"
                value={newArcLabel}
                onChange={(e) => setNewArcLabel(e.target.value)}
                placeholder="e.g. replicate"
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label htmlFor="create-arc-weight" className="block text-xs font-medium text-[var(--text-secondary)]">
                Weight
              </label>
              <input
                id="create-arc-weight"
                type="number"
                min={0}
                value={newArcWeight}
                onChange={(e) => setNewArcWeight(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label htmlFor="create-arc-group" className="block text-xs font-medium text-[var(--text-secondary)]">
                Group Tag
              </label>
              <input
                id="create-arc-group"
                type="text"
                value={newArcGroup}
                onChange={(e) => setNewArcGroup(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCreateArc(false)}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Create Arc</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateArc(true)}
              className="min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              Queue Arc
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Multi-Select Nodes & Arcs Tables */}
      {hasReadRight && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Nodes Directory ({queryResult.nodes.length})
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                    <th scope="col" className="py-2 pr-2">Group</th>
                    <th scope="col" className="py-2 pr-2">ID</th>
                    <th scope="col" className="py-2 pr-2">Label</th>
                    <th scope="col" className="py-2 pr-2">Shard / Tag</th>
                    <th scope="col" className="py-2 pr-2">Status</th>
                    <th scope="col" className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {queryResult.nodes.map((node) => {
                    const checked = selectedNodeSet.has(node.id);
                    return (
                      <tr key={node.id}>
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            aria-label={`Select node ${node.id} ${node.label}`}
                            onChange={(e) => {
                              setSelectedNodeIds((prev) =>
                                e.target.checked
                                  ? [...prev, node.id]
                                  : prev.filter((id) => id !== node.id)
                              );
                            }}
                            className="h-4 w-4 accent-[var(--accent-primary)] cursor-pointer"
                          />
                        </td>
                        <td className="py-2 pr-2 font-mono font-semibold text-[var(--text-primary)]">
                          {node.id}
                        </td>
                        <td className="py-2 pr-2 text-[var(--text-primary)]">{node.label}</td>
                        <td className="py-2 pr-2 font-mono text-[var(--text-secondary)]">
                          {node.shard} · {node.groupTag}
                        </td>
                        <td className="py-2 pr-2 font-medium text-[var(--text-primary)]">
                          {node.status}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              runImmediateOps(
                                [{ id: `del-${node.id}`, kind: 'delete-nodes', nodeIds: [node.id] }],
                                `Deleted node ${node.id} and its incident arcs.`
                              )
                            }
                            aria-label={`Delete node ${node.id}`}
                            className="inline-flex min-h-[32px] items-center gap-1 rounded border border-[var(--border-hairline)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Arcs Directory ({queryResult.arcs.length})
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                    <th scope="col" className="py-2 pr-2">Group</th>
                    <th scope="col" className="py-2 pr-2">ID</th>
                    <th scope="col" className="py-2 pr-2">Direction</th>
                    <th scope="col" className="py-2 pr-2">Label / Tag</th>
                    <th scope="col" className="py-2 pr-2">Weight</th>
                    <th scope="col" className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {queryResult.arcs.map((arc) => {
                    const checked = selectedArcSet.has(arc.id);
                    return (
                      <tr key={arc.id}>
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            aria-label={`Select arc ${arc.id} ${arc.label}`}
                            onChange={(e) => {
                              setSelectedArcIds((prev) =>
                                e.target.checked
                                  ? [...prev, arc.id]
                                  : prev.filter((id) => id !== arc.id)
                              );
                            }}
                            className="h-4 w-4 accent-[var(--accent-primary)] cursor-pointer"
                          />
                        </td>
                        <td className="py-2 pr-2 font-mono font-semibold text-[var(--text-primary)]">
                          {arc.id}
                        </td>
                        <td className="py-2 pr-2 font-mono text-[var(--text-primary)]">
                          {arc.source} -&gt; {arc.target}
                        </td>
                        <td className="py-2 pr-2 text-[var(--text-secondary)]">
                          {arc.label} · {arc.groupTag} ({arc.status})
                        </td>
                        <td className="py-2 pr-2 font-mono tabular-nums text-[var(--text-primary)]">
                          {arc.weight}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              runImmediateOps(
                                [{ id: `del-${arc.id}`, kind: 'delete-arcs', arcIds: [arc.id] }],
                                `Deleted arc ${arc.id}.`
                              )
                            }
                            aria-label={`Delete arc ${arc.id}`}
                            className="inline-flex min-h-[32px] items-center gap-1 rounded border border-[var(--border-hairline)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Object-Capability Delegation & Revocation Deck */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Object-Capability Delegation and Revocation
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Attenuate narrower child capabilities (rights and shard scope can only shrink) or revoke an authority chain.
              </p>
            </div>
          </div>
        </div>

        {ocapFeedback && (
          <p
            role={ocapFeedback.type === 'error' ? 'alert' : 'status'}
            className={`text-xs font-semibold ${
              ocapFeedback.type === 'error'
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {ocapFeedback.text}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <form onSubmit={handleAttenuateSubmit} noValidate className="lg:col-span-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Attenuate Child Capability
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="att-parent" className="block text-xs font-medium text-[var(--text-secondary)]">
                  Parent Token
                </label>
                <select
                  id="att-parent"
                  value={attParentId}
                  onChange={(e) => setAttParentId(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)]"
                >
                  {capabilities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.scope})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="att-scope" className="block text-xs font-medium text-[var(--text-secondary)]">
                  Confined Scope
                </label>
                <select
                  id="att-scope"
                  value={attScope}
                  onChange={(e) => setAttScope(e.target.value as CapabilityScope)}
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)]"
                >
                  <option value="all">all</option>
                  <option value="Shard-A">Shard-A</option>
                  <option value="Shard-B">Shard-B</option>
                  <option value="Shard-C">Shard-C</option>
                </select>
              </div>
              <div>
                <label htmlFor="att-label" className="block text-xs font-medium text-[var(--text-secondary)]">
                  New Token Name
                </label>
                <input
                  id="att-label"
                  type="text"
                  value={attLabel}
                  onChange={(e) => setAttLabel(e.target.value)}
                  placeholder="e.g. Shard-B Batcher"
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label htmlFor="att-holder" className="block text-xs font-medium text-[var(--text-secondary)]">
                  Holder Principal
                </label>
                <input
                  id="att-holder"
                  type="text"
                  value={attHolder}
                  onChange={(e) => setAttHolder(e.target.value)}
                  placeholder="e.g. Sync Worker"
                  className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>

            <fieldset>
              <legend className="text-xs font-medium text-[var(--text-secondary)]">
                Attenuated Rights
              </legend>
              <div className="mt-1.5 flex flex-wrap gap-3">
                {ALL_RIGHTS.map((r) => (
                  <label key={r} className="inline-flex items-center gap-1.5 text-xs text-[var(--text-primary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attRights.includes(r)}
                      onChange={(e) => {
                        setAttRights((prev) =>
                          e.target.checked ? [...prev, r] : prev.filter((item) => item !== r)
                        );
                      }}
                      className="h-3.5 w-3.5 accent-[var(--accent-primary)]"
                    />
                    <span className="font-mono">{r}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              className="min-h-[40px] w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              Mint Attenuated Token
            </button>
          </form>

          {/* Capability Registry */}
          <div className="lg:col-span-7 overflow-x-auto">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Capability Registry ({capabilities.length})
            </h3>
            <table className="mt-2 w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                  <th scope="col" className="py-2 pr-2">Token</th>
                  <th scope="col" className="py-2 pr-2">Scope</th>
                  <th scope="col" className="py-2 pr-2">Rights</th>
                  <th scope="col" className="py-2 pr-2">Status</th>
                  <th scope="col" className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {capabilities.map((cap) => {
                  const active = isCapabilityActive(cap.id, capabilities);
                  const isCurrent = cap.id === activeCapabilityId;
                  return (
                    <tr key={cap.id}>
                      <td className="py-2 pr-2">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {cap.label}
                        </div>
                        <div className="font-mono text-[11px] text-[var(--text-muted)]">
                          {cap.id} · holder: {cap.holder}
                        </div>
                      </td>
                      <td className="py-2 pr-2 font-mono text-[var(--text-primary)]">
                        {cap.scope}
                      </td>
                      <td className="py-2 pr-2 font-mono text-[var(--text-secondary)]">
                        {cap.rights.join(', ')}
                      </td>
                      <td
                        className={`py-2 pr-2 font-medium ${
                          active
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {active ? (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{active ? 'Active' : 'Revoked'}</span>
                        </span>
                      </td>
                      <td className="py-2 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateCapabilities(capabilities, cap.id)}
                          disabled={isCurrent}
                          className="min-h-[32px] rounded border border-[var(--border-hairline)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isCurrent ? 'In Use' : 'Use'}
                        </button>
                        {cap.id !== 'cap-root' && active && (
                          <button
                            type="button"
                            onClick={() => handleRevokeCap(cap.id)}
                            aria-label={`Revoke capability ${cap.label}`}
                            className="min-h-[32px] rounded border border-red-500/50 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
