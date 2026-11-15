import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Eye,
  KeyRound,
  Layers,
  Lock,
  Play,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  assignShardByConsistentHash,
  describeGraphNodeAccessibility,
} from '../core/accessibilityOutput';
import { translateUi, type SupportedUiLocale } from '../core/i18n';
import {
  executeGraphBatch,
  isCapabilityActive,
  queryGraph,
  type BatchOperation,
  type CapabilityToken,
  type GraphArc,
  type GraphEntityStatus,
  type GraphNode,
  type GraphQuery,
} from '../core/ocapGraph';

interface GraphOcapViewProps {
  nodes: GraphNode[];
  arcs: GraphArc[];
  selectedNodeIds: string[];
  selectedArcIds: string[];
  capabilities: CapabilityToken[];
  activeCapabilityId: string;
  healthyShards: Array<'Shard-A' | 'Shard-B' | 'Shard-C'>;
  outputChannelLabel: string;
  uiLocale?: SupportedUiLocale;
  onChangeSelectedNodes: React.Dispatch<React.SetStateAction<string[]>>;
  onChangeSelectedArcs: React.Dispatch<React.SetStateAction<string[]>>;
  onUpdateGraph: (nodes: GraphNode[], arcs: GraphArc[]) => void;
  onUpdateCapabilities: (caps: CapabilityToken[], activeId: string) => void;
  onOpenCapabilities: () => void;
  onAnnounce: (severity: 'info' | 'warning' | 'success', summary: string) => void;
}

const SHARD_LIST: Array<'Shard-A' | 'Shard-B' | 'Shard-C'> = [
  'Shard-A',
  'Shard-B',
  'Shard-C',
];

const SHARD_COLORS: Record<GraphNode['shard'], string> = {
  'Shard-A': '#0284c7',
  'Shard-B': '#059669',
  'Shard-C': '#d97706',
};

const SHARD_ZONES: Record<
  GraphNode['shard'],
  { x: number; width: number; centerX: number; tactileZone: string }
> = {
  'Shard-A': { x: 12, width: 190, centerX: 107, tactileZone: 'PT Zone A (Left)' },
  'Shard-B': { x: 215, width: 190, centerX: 310, tactileZone: 'PT Zone B (Center)' },
  'Shard-C': { x: 418, width: 190, centerX: 513, tactileZone: 'PT Zone C (Right)' },
};

export const GraphOcapView: React.FC<GraphOcapViewProps> = ({
  nodes,
  arcs,
  selectedNodeIds,
  selectedArcIds,
  capabilities,
  activeCapabilityId,
  healthyShards,
  outputChannelLabel,
  uiLocale = 'en',
  onChangeSelectedNodes,
  onChangeSelectedArcs,
  onUpdateGraph,
  onUpdateCapabilities,
  onOpenCapabilities,
  onAnnounce,
}) => {
  const [focusedNodeId, setFocusedNodeId] = useState<string>(nodes[0]?.id ?? 'N1');
  const editNodeLabelRef = useRef<HTMLInputElement>(null);
  const editArcLabelRef = useRef<HTMLInputElement>(null);

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
  const [autoAssignShard, setAutoAssignShard] = useState(true);
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

  // Single Node Edit form
  const [editNodeId, setEditNodeId] = useState<string>(nodes[0]?.id ?? '');
  const [editNodeLabel, setEditNodeLabel] = useState<string>(nodes[0]?.label ?? '');
  const [editNodeShard, setEditNodeShard] = useState<GraphNode['shard']>(
    nodes[0]?.shard ?? 'Shard-A'
  );
  const [editNodeStatus, setEditNodeStatus] = useState<GraphEntityStatus>(
    nodes[0]?.status ?? 'active'
  );
  const [editNodeGroup, setEditNodeGroup] = useState<string>(nodes[0]?.groupTag ?? 'core');

  // Single Arc Edit form
  const [editArcId, setEditArcId] = useState<string>(arcs[0]?.id ?? '');
  const [editArcSource, setEditArcSource] = useState<string>(arcs[0]?.source ?? 'N1');
  const [editArcTarget, setEditArcTarget] = useState<string>(arcs[0]?.target ?? 'N2');
  const [editArcLabel, setEditArcLabel] = useState<string>(arcs[0]?.label ?? '');
  const [editArcWeight, setEditArcWeight] = useState<string>(String(arcs[0]?.weight ?? 10));
  const [editArcStatus, setEditArcStatus] = useState<GraphEntityStatus>(
    arcs[0]?.status ?? 'active'
  );
  const [editArcGroup, setEditArcGroup] = useState<string>(arcs[0]?.groupTag ?? 'data');

  // Batch Queue
  const [batchQueue, setBatchQueue] = useState<BatchOperation[]>([]);
  const [opFeedback, setOpFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const loadNodeIntoEditor = (node: GraphNode) => {
    setEditNodeId(node.id);
    setEditNodeLabel(node.label);
    setEditNodeShard(node.shard);
    setEditNodeStatus(node.status);
    setEditNodeGroup(node.groupTag);
  };

  const loadArcIntoEditor = (arc: GraphArc) => {
    setEditArcId(arc.id);
    setEditArcSource(arc.source);
    setEditArcTarget(arc.target);
    setEditArcLabel(arc.label);
    setEditArcWeight(String(arc.weight));
    setEditArcStatus(arc.status);
    setEditArcGroup(arc.groupTag);
  };

  useEffect(() => {
    const match = nodes.find((n) => n.id === editNodeId) ?? nodes[0];
    if (match && match.id !== editNodeId) {
      loadNodeIntoEditor(match);
    }
  }, [nodes, editNodeId]);

  useEffect(() => {
    const match = arcs.find((a) => a.id === editArcId) ?? arcs[0];
    if (match && match.id !== editArcId) {
      loadArcIntoEditor(match);
    }
  }, [arcs, editArcId]);

  const activeCap = useMemo(
    () => capabilities.find((c) => c.id === activeCapabilityId) ?? capabilities[0],
    [capabilities, activeCapabilityId]
  );

  const activeCapValid = useMemo(
    () => (activeCap ? isCapabilityActive(activeCap.id, capabilities) : false),
    [activeCap, capabilities]
  );

  const hasReadRight = useMemo(
    () => Boolean(activeCapValid && activeCap?.rights.includes('read')),
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

  const effectiveNewNodeShard = useMemo(() => {
    if (!autoAssignShard) return newNodeShard;
    return assignShardByConsistentHash(newNodeId.trim() || 'N-next', healthyShards);
  }, [autoAssignShard, newNodeId, newNodeShard, healthyShards]);

  // Compute deterministic layout inside the 3 Shard Cluster zones so shard membership is visually unmistakable
  const nodeVisualCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    for (const shard of SHARD_LIST) {
      const zone = SHARD_ZONES[shard];
      const shardNodes = nodes.filter((n) => n.shard === shard);
      shardNodes.forEach((n, idx) => {
        const colOffset =
          shardNodes.length === 1
            ? 0
            : idx % 2 === 0
              ? -44
              : 44;
        const row = shardNodes.length > 2 ? Math.floor(idx / 2) : idx;
        const totalRows = shardNodes.length > 2 ? Math.ceil(shardNodes.length / 2) : shardNodes.length;
        const spacing = totalRows <= 1 ? 0 : Math.min(108, 175 / Math.max(1, totalRows - 1));
        const startY = totalRows <= 1 ? 165 : 98;
        coords[n.id] = {
          x: zone.centerX + colOffset,
          y: startY + row * spacing,
        };
      });
    }
    return coords;
  }, [nodes]);

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

  const buildCreateNodeOp = (): {
    op?: BatchOperation;
    shard?: GraphNode['shard'];
    error?: string;
  } => {
    const id = newNodeId.trim();
    const label = newNodeLabel.trim();
    if (!id || !label) {
      return { error: 'Node ID and Label are required to create a node.' };
    }
    const chosenShard = autoAssignShard
      ? assignShardByConsistentHash(id, healthyShards)
      : newNodeShard;
    const zone = SHARD_ZONES[chosenShard];
    const existingInShard = nodes.filter((n) => n.shard === chosenShard).length;
    return {
      shard: chosenShard,
      op: {
        id: `op-cn-${Date.now()}`,
        kind: 'create-node',
        node: {
          id,
          label,
          shard: chosenShard,
          status: 'active',
          groupTag: newNodeGroup.trim() || 'general',
          x: zone.centerX,
          y: 100 + existingInShard * 75,
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
    if (built.error || !built.op || !built.shard) {
      setOpFeedback({ type: 'error', text: built.error ?? 'Invalid node input.' });
      return;
    }
    const id = newNodeId.trim();
    const label = newNodeLabel.trim();
    if (queueOnly) {
      setBatchQueue((prev) => [...prev, built.op!]);
      setOpFeedback({
        type: 'success',
        text: `Queued creation of node ${id} in ${built.shard}.`,
      });
      onAnnounce('info', `Queued node ${id} (${built.shard}) into batch.`);
      setNewNodeId('');
      setNewNodeLabel('');
    } else if (
      runImmediateOps(
        [built.op],
        `Created node ${id} (${label}) on ${built.shard}.`
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
    const id = newArcId.trim();
    if (queueOnly) {
      setBatchQueue((prev) => [...prev, built.op!]);
      setOpFeedback({ type: 'success', text: `Queued creation of arc ${id}.` });
      onAnnounce('info', `Queued arc ${id} (${newArcSource} -> ${newArcTarget}) into batch.`);
      setNewArcId('');
      setNewArcLabel('');
    } else if (
      runImmediateOps(
        [built.op],
        `Created arc ${id} (${newArcSource} -> ${newArcTarget}).`
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
        `Updated ${selectedNodeIds.length} node(s) and ${selectedArcIds.length} arc(s) to "${groupTargetStatus}" on ${groupTargetShard}.`
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
      onChangeSelectedNodes([]);
      onChangeSelectedArcs([]);
    }
  };

  const handleSaveSingleNodeEdit = (queueOnly: boolean) => {
    if (!editNodeId) {
      setOpFeedback({ type: 'error', text: 'Select a node to edit.' });
      return;
    }
    const cleanLabel = editNodeLabel.trim();
    if (!cleanLabel) {
      setOpFeedback({ type: 'error', text: 'Node label cannot be empty.' });
      return;
    }
    const op: BatchOperation = {
      id: `op-edit-n-${Date.now()}`,
      kind: 'update-nodes',
      nodeIds: [editNodeId],
      patch: {
        label: cleanLabel,
        shard: editNodeShard,
        status: editNodeStatus,
        groupTag: editNodeGroup.trim() || 'general',
      },
    };
    if (queueOnly) {
      setBatchQueue((prev) => [...prev, op]);
      setOpFeedback({ type: 'success', text: `Queued edit for node ${editNodeId}.` });
      onAnnounce('info', `Queued edit for node ${editNodeId}.`);
    } else {
      runImmediateOps(
        [op],
        `Updated node ${editNodeId} (${cleanLabel}) on ${editNodeShard} (${editNodeStatus}).`
      );
    }
  };

  const handleSaveSingleArcEdit = (queueOnly: boolean) => {
    if (!editArcId) {
      setOpFeedback({ type: 'error', text: 'Select an arc to edit.' });
      return;
    }
    const cleanLabel = editArcLabel.trim();
    const weightNum = Number(editArcWeight);
    if (!cleanLabel) {
      setOpFeedback({ type: 'error', text: 'Arc label cannot be empty.' });
      return;
    }
    if (!Number.isFinite(weightNum) || weightNum < 0) {
      setOpFeedback({ type: 'error', text: 'Arc weight must be a non-negative number.' });
      return;
    }
    const op: BatchOperation = {
      id: `op-edit-a-${Date.now()}`,
      kind: 'update-arcs',
      arcIds: [editArcId],
      patch: {
        source: editArcSource,
        target: editArcTarget,
        label: cleanLabel,
        weight: weightNum,
        status: editArcStatus,
        groupTag: editArcGroup.trim() || 'data',
      },
    };
    if (queueOnly) {
      setBatchQueue((prev) => [...prev, op]);
      setOpFeedback({ type: 'success', text: `Queued edit for arc ${editArcId}.` });
      onAnnounce('info', `Queued edit for arc ${editArcId}.`);
    } else {
      runImmediateOps(
        [op],
        `Updated arc ${editArcId} (${editArcSource} -> ${editArcTarget}, w=${weightNum}, ${editArcStatus}).`
      );
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
    onChangeSelectedNodes((prev) => prev.filter((id) => existingNodeIds.has(id)));
    onChangeSelectedArcs((prev) => prev.filter((id) => existingArcIds.has(id)));
    setOpFeedback({ type: 'success', text: res.summary });
    onAnnounce('success', res.summary);
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
    const desc = describeGraphNodeAccessibility(chosen, arcs, activeCap, capabilities);
    setFocusedNodeId(chosen.id);
    onAnnounce(
      'info',
      `Focused node ${chosen.id} (${chosen.label}) in ${chosen.shard}, status ${chosen.status}, OCap ${desc.guardLabel}.`
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
      {/* Header + Inline Active Object-Capability Guardrail Strip */}
      <div className="flex flex-col gap-4 border-b border-[var(--border-hairline)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-xl">
          <h1
            id="graph-ocap-heading"
            className="text-2xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            {translateUi(uiLocale, 'graphWorkspaceTitle')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {translateUi(uiLocale, 'graphWorkspaceSubtitle')}
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

          <button
            type="button"
            onClick={onOpenCapabilities}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
            <span>Delegate / Revoke</span>
          </button>

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

      {/* Feedback Banner */}
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

      {/* Main Workspace: Sharded Topology + Group/Batch Action Deck */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Visual Shard Zones & OCap Guarded Graph SVG + Linear Summary */}
        <div
          dir="ltr"
          className="lg:col-span-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Sharded Distributed Graph &amp; OCap Guardrails
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Each column represents a physical shard. Nodes show active capability access ({outputChannelLabel} output active).
              </p>
            </div>
            <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
              {nodes.length} nodes · {arcs.length} arcs
            </span>
          </div>

          {!hasReadRight ? (
            <div
              role="alert"
              className="rounded-lg bg-[var(--bg-subtle)] p-6 text-sm text-[var(--text-secondary)]"
            >
              Active token lacks &quot;read&quot; authority or has been revoked. Switch to a valid capability token to inspect distributed graph topology.
            </div>
          ) : (
            <>
              <div
                tabIndex={0}
                role="region"
                aria-label="Sharded distributed graph diagram. Use Left and Right arrow keys to inspect nodes and their OCap guardrails."
                onKeyDown={handleSvgKeyDown}
                className="overflow-x-auto rounded-lg bg-[var(--bg-subtle)] p-3"
              >
                <svg
                  viewBox="0 0 620 330"
                  className="mx-auto h-72 w-full min-w-[540px]"
                  role="img"
                  aria-label={`Distributed graph across 3 shards with ${nodes.length} nodes and ${arcs.length} arcs`}
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

                  {/* 3 Distinct Shard Cluster Zones */}
                  {SHARD_LIST.map((shard) => {
                    const zone = SHARD_ZONES[shard];
                    const isShardInCap =
                      activeCapValid &&
                      (activeCap?.scope === 'all' || activeCap?.scope === shard);
                    const count = nodes.filter((n) => n.shard === shard).length;
                    return (
                      <g key={shard}>
                        <rect
                          x={zone.x}
                          y={12}
                          width={zone.width}
                          height={306}
                          rx={10}
                          fill="var(--bg-surface)"
                          fillOpacity={isShardInCap ? 0.92 : 0.45}
                          stroke={
                            isShardInCap ? SHARD_COLORS[shard] : 'var(--border-hairline)'
                          }
                          strokeWidth={isShardInCap ? 1.5 : 1}
                          strokeDasharray={isShardInCap ? undefined : '4 4'}
                        />
                        <text
                          x={zone.x + 12}
                          y={32}
                          className="fill-[var(--text-primary)] text-[11px] font-mono font-bold"
                        >
                          {shard} ({count})
                        </text>
                        <text
                          x={zone.x + 12}
                          y={46}
                          className={`text-[9px] font-semibold ${
                            isShardInCap
                              ? 'fill-emerald-700 dark:fill-emerald-400'
                              : 'fill-red-600 dark:fill-red-400'
                          }`}
                        >
                          {isShardInCap ? 'OCap: In Scope' : 'OCap: Locked'}
                        </text>
                      </g>
                    );
                  })}

                  {/* Directed Arcs */}
                  {arcs.map((arc) => {
                    const src = nodeVisualCoords[arc.source];
                    const tgt = nodeVisualCoords[arc.target];
                    if (!src || !tgt) return null;
                    const dx = tgt.x - src.x;
                    const dy = tgt.y - src.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    const startPad = Math.min(22, dist * 0.25);
                    const endPad = Math.min(25, dist * 0.35);
                    const x1 = src.x + (dx / dist) * startPad;
                    const y1 = src.y + (dy / dist) * startPad;
                    const x2 = tgt.x - (dx / dist) * endPad;
                    const y2 = tgt.y - (dy / dist) * endPad;
                    const isMatched = matchedArcSet.has(arc.id);
                    const isSelected = selectedArcSet.has(arc.id);
                    const isSteep = Math.abs(dx) < Math.abs(dy);
                    const nx = isSteep ? (-dy / dist) * 18 : 0;
                    const ny = isSteep ? (dx / dist) * 18 : -10;
                    const midX = (x1 + x2) / 2 + nx;
                    const midY = (y1 + y2) / 2 + ny;
                    const labelText = `${arc.id}(${arc.weight})`;
                    const pillW = labelText.length * 6.2 + 8;
                    return (
                      <g key={arc.id} opacity={isMatched ? 1 : 0.25}>
                        <title>{`Arc ${arc.id}: ${arc.source} -> ${arc.target} (${arc.label}, w=${arc.weight})`}</title>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={
                            isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'
                          }
                          strokeWidth={isSelected ? 3 : 1.75}
                          strokeDasharray={arc.status === 'maintenance' ? '5 4' : undefined}
                          markerEnd="url(#arc-arrow)"
                        />
                        <rect
                          x={midX - pillW / 2}
                          y={midY - 10}
                          width={pillW}
                          height={14}
                          rx={3}
                          fill="var(--bg-surface)"
                          fillOpacity={0.92}
                        />
                        <text
                          x={midX}
                          y={midY}
                          textAnchor="middle"
                          className="fill-[var(--text-primary)] text-[10px] font-mono font-semibold"
                        >
                          {labelText}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes with OCap Guardrail Badges */}
                  {nodes.map((node) => {
                    const pos = nodeVisualCoords[node.id] ?? { x: node.x, y: node.y };
                    const isMatched = matchedNodeSet.has(node.id);
                    const isSelected = selectedNodeSet.has(node.id);
                    const isFocused = focusedNodeId === node.id;
                    const desc = describeGraphNodeAccessibility(
                      node,
                      arcs,
                      activeCap,
                      capabilities
                    );
                    const guardTag = !activeCapValid
                      ? 'REVOKED'
                      : !desc.canUpdate && desc.guardLabel.startsWith('Locked')
                        ? 'LOCKED'
                        : desc.canDelete
                          ? 'RWD'
                          : desc.canUpdate
                            ? 'RW'
                            : 'RO';
                    return (
                      <g
                        key={node.id}
                        opacity={isMatched ? 1 : 0.3}
                        className="cursor-pointer"
                        onClick={() => {
                          setFocusedNodeId(node.id);
                          onAnnounce(
                            'info',
                            `Inspected node ${node.id} (${node.label}) in ${node.shard} · OCap: ${desc.guardLabel}.`
                          );
                        }}
                      >
                        <title>{`${node.id}: ${node.label} (${node.shard}, ${node.status}, OCap: ${desc.guardLabel})`}</title>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isFocused ? 23 : 20}
                          fill={SHARD_COLORS[node.shard]}
                          fillOpacity={guardTag === 'LOCKED' || guardTag === 'REVOKED' ? 0.55 : 1}
                          stroke={
                            isSelected
                              ? 'var(--text-primary)'
                              : 'var(--bg-surface)'
                          }
                          strokeWidth={isSelected ? 3.5 : 2}
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 4}
                          textAnchor="middle"
                          className="fill-white text-[11px] font-mono font-bold"
                        >
                          {node.id}
                        </text>
                        <text
                          x={pos.x}
                          y={pos.y + 33}
                          textAnchor="middle"
                          className="fill-[var(--text-primary)] text-[10px] font-semibold"
                        >
                          {node.label.length > 15
                            ? `${node.label.slice(0, 14)}…`
                            : node.label}
                        </text>
                        <text
                          x={pos.x}
                          y={pos.y + 44}
                          textAnchor="middle"
                          className="fill-[var(--text-muted)] text-[9px] font-mono font-semibold"
                        >
                          [{guardTag}]
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Linear Deaf-Blind / Braille / Protactile Adjacency Summary */}
              <div className="border-t border-[var(--border-hairline)] pt-3">
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                  Linear Shard, OCap &amp; Adjacency Summary
                </h3>
                <ul className="mt-2 space-y-1 font-mono text-xs text-[var(--text-secondary)]">
                  {queryResult.nodes.map((n) => {
                    const outgoing = queryResult.arcs.filter((a) => a.source === n.id);
                    const desc = describeGraphNodeAccessibility(
                      n,
                      arcs,
                      activeCap,
                      capabilities
                    );
                    const outText =
                      outgoing.length > 0
                        ? outgoing
                            .map((a) => `${a.id}:${a.label}(w=${a.weight})->${a.target}`)
                            .join(', ')
                        : 'no outgoing arcs';
                    return (
                      <li key={n.id}>
                        {n.id} [{n.shard}|{n.status}|OCap:{desc.guardLabel}] :: {outText}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Right: Group Operations & Atomic Batch Queue */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Group Operations ({selectedNodeIds.length} Nodes · {selectedArcIds.length} Arcs)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Update status, migrate shard, or delete the chosen group immediately or queue into an atomic batch.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="group-status-select"
                  className="block text-xs font-medium text-[var(--text-secondary)]"
                >
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
                <label
                  htmlFor="group-shard-select"
                  className="block text-xs font-medium text-[var(--text-secondary)]"
                >
                  Target Shard
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
                <label
                  htmlFor="group-weight-input"
                  className="block text-xs font-medium text-[var(--text-secondary)]"
                >
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
                <label
                  htmlFor="group-tag-input"
                  className="block text-xs font-medium text-[var(--text-secondary)]"
                >
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

      {/* Create Node (with Consistent-Hash Auto-Sharding) & Create Arc Forms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Create Node
            </h2>
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={autoAssignShard}
                onChange={(e) => setAutoAssignShard(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--accent-primary)]"
              />
              <span>Auto-Shard by Hash ({effectiveNewNodeShard})</span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="create-node-id"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
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
              <label
                htmlFor="create-node-label"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
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
              <label
                htmlFor="create-node-shard"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Shard {autoAssignShard ? '(Hash-Derived)' : '(Manual)'}
              </label>
              <select
                id="create-node-shard"
                value={effectiveNewNodeShard}
                disabled={autoAssignShard}
                onChange={(e) => setNewNodeShard(e.target.value as GraphNode['shard'])}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70"
              >
                <option value="Shard-A">Shard-A</option>
                <option value="Shard-B">Shard-B</option>
                <option value="Shard-C">Shard-C</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="create-node-group"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
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
              <label
                htmlFor="create-arc-id"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
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
              <label
                htmlFor="create-arc-source"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
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
              <label
                htmlFor="create-arc-target"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
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
              <label
                htmlFor="create-arc-label"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
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
              <label
                htmlFor="create-arc-weight"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
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
              <label
                htmlFor="create-arc-group"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
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

      {/* Single-Entity Accessible Edit Node & Edit Directed Arc Forms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          id="edit-node-card"
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Edit Single Node
            </h2>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              OCap-enforced update
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-node-id"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Node to Edit
              </label>
              <select
                id="edit-node-id"
                value={editNodeId}
                onChange={(e) => {
                  const chosen = nodes.find((n) => n.id === e.target.value);
                  if (chosen) loadNodeIntoEditor(chosen);
                }}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} · {n.label} ({n.shard})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="edit-node-label"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Updated Label
              </label>
              <input
                ref={editNodeLabelRef}
                id="edit-node-label"
                type="text"
                value={editNodeLabel}
                onChange={(e) => setEditNodeLabel(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="edit-node-shard"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Shard Zone
              </label>
              <select
                id="edit-node-shard"
                value={editNodeShard}
                onChange={(e) => setEditNodeShard(e.target.value as GraphNode['shard'])}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                <option value="Shard-A">Shard-A (PT Zone A)</option>
                <option value="Shard-B">Shard-B (PT Zone B)</option>
                <option value="Shard-C">Shard-C (PT Zone C)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="edit-node-status"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Status
              </label>
              <select
                id="edit-node-status"
                value={editNodeStatus}
                onChange={(e) => setEditNodeStatus(e.target.value as GraphEntityStatus)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                <option value="active">active</option>
                <option value="maintenance">maintenance</option>
                <option value="isolated">isolated</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="edit-node-group"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Group Tag
              </label>
              <input
                id="edit-node-group"
                type="text"
                value={editNodeGroup}
                onChange={(e) => setEditNodeGroup(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSaveSingleNodeEdit(false)}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Node Changes</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveSingleNodeEdit(true)}
              className="min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              Queue Node Edit
            </button>
          </div>
        </div>

        <div
          id="edit-arc-card"
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Edit Directed Arc
            </h2>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              Re-wire endpoints &amp; weight
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="edit-arc-id"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Arc to Edit
              </label>
              <select
                id="edit-arc-id"
                value={editArcId}
                onChange={(e) => {
                  const chosen = arcs.find((a) => a.id === e.target.value);
                  if (chosen) loadArcIntoEditor(chosen);
                }}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              >
                {arcs.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} ({a.source} -&gt; {a.target})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="edit-arc-source"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Source Node
              </label>
              <select
                id="edit-arc-source"
                value={editArcSource}
                onChange={(e) => setEditArcSource(e.target.value)}
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
              <label
                htmlFor="edit-arc-target"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Target Node
              </label>
              <select
                id="edit-arc-target"
                value={editArcTarget}
                onChange={(e) => setEditArcTarget(e.target.value)}
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
              <label
                htmlFor="edit-arc-label"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Updated Label
              </label>
              <input
                ref={editArcLabelRef}
                id="edit-arc-label"
                type="text"
                value={editArcLabel}
                onChange={(e) => setEditArcLabel(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="edit-arc-weight"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Weight
              </label>
              <input
                id="edit-arc-weight"
                type="number"
                min={0}
                value={editArcWeight}
                onChange={(e) => setEditArcWeight(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="edit-arc-status"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Status
              </label>
              <select
                id="edit-arc-status"
                value={editArcStatus}
                onChange={(e) => setEditArcStatus(e.target.value as GraphEntityStatus)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                <option value="active">active</option>
                <option value="maintenance">maintenance</option>
                <option value="isolated">isolated</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor="edit-arc-group"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Group Tag
              </label>
              <input
                id="edit-arc-group"
                type="text"
                value={editArcGroup}
                onChange={(e) => setEditArcGroup(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSaveSingleArcEdit(false)}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Arc Changes</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveSingleArcEdit(true)}
              className="min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
            >
              Queue Arc Edit
            </button>
          </div>
        </div>
      </div>

      {/* Query & Group Selection Controls */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Query, Find, and Group-Select Nodes and Arcs
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Filter by identifier, shard, status, arc weight, or BFS reachability, then select matching entities as a group.
            </p>
          </div>
          <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
            Matched: {queryResult.nodes.length}/{nodes.length} nodes · {queryResult.arcs.length}/{arcs.length} arcs
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label
              htmlFor="graph-query-text"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
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
            <label
              htmlFor="graph-query-shard"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
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
            <label
              htmlFor="graph-query-status"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
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
            <label
              htmlFor="graph-query-weight"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
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
            <label
              htmlFor="graph-query-reach"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
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

        <div className="flex flex-wrap items-center gap-2.5 border-t border-[var(--border-hairline)] pt-3">
          <button
            type="button"
            onClick={() => {
              const ids = queryResult.nodes.map((n) => n.id);
              onChangeSelectedNodes(ids);
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
              onChangeSelectedArcs(ids);
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
              onChangeSelectedArcs(incident);
              onAnnounce(
                'info',
                `Selected ${incident.length} incident arc(s) connected to chosen nodes.`
              );
            }}
            className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
          >
            Select Incident Arcs
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeSelectedNodes([]);
              onChangeSelectedArcs([]);
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

      {/* Accessible Multi-Select Nodes & Arcs Directories with Live OCap Guard Column */}
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
                    <th scope="col" className="py-2 pr-2">Node</th>
                    <th scope="col" className="py-2 pr-2">Shard · Status</th>
                    <th scope="col" className="py-2 pr-2">OCap Guard</th>
                    <th scope="col" className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {queryResult.nodes.map((node) => {
                    const checked = selectedNodeSet.has(node.id);
                    const desc = describeGraphNodeAccessibility(
                      node,
                      arcs,
                      activeCap,
                      capabilities
                    );
                    const GuardIcon = desc.canUpdate
                      ? ShieldCheck
                      : desc.guardLabel === 'Read-Only'
                        ? Eye
                        : Lock;
                    const guardTone = desc.canUpdate
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : desc.guardLabel === 'Read-Only'
                        ? 'text-[var(--accent-primary)]'
                        : 'text-red-600 dark:text-red-400';

                    return (
                      <tr key={node.id}>
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            aria-label={`Select node ${node.id} ${node.label}`}
                            onChange={(e) => {
                              onChangeSelectedNodes((prev) =>
                                e.target.checked
                                  ? [...prev, node.id]
                                  : prev.filter((id) => id !== node.id)
                              );
                            }}
                            className="h-4 w-4 accent-[var(--accent-primary)] cursor-pointer"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <span className="font-mono font-semibold text-[var(--text-primary)]">
                            {node.id}
                          </span>{' '}
                          <span className="text-[var(--text-secondary)]">· {node.label}</span>
                        </td>
                        <td className="py-2 pr-2 font-mono text-[var(--text-secondary)]">
                          {node.shard} · {node.status}
                        </td>
                        <td className={`py-2 pr-2 font-medium ${guardTone}`}>
                          <span className="inline-flex items-center gap-1">
                            <GuardIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{desc.guardLabel}</span>
                          </span>
                        </td>
                        <td className="py-2 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              loadNodeIntoEditor(node);
                              onAnnounce(
                                'info',
                                `Loaded node ${node.id} (${node.label}) into Single Node editor.`
                              );
                              setTimeout(() => editNodeLabelRef.current?.focus(), 0);
                            }}
                            aria-label={`Edit node ${node.id}`}
                            className="inline-flex min-h-[32px] items-center gap-1 rounded border border-[var(--border-hairline)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
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
                    <th scope="col" className="py-2 pr-2">Label / Status</th>
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
                              onChangeSelectedArcs((prev) =>
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
                        <td className="py-2 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              loadArcIntoEditor(arc);
                              onAnnounce(
                                'info',
                                `Loaded arc ${arc.id} (${arc.source} -> ${arc.target}) into Directed Arc editor.`
                              );
                              setTimeout(() => editArcLabelRef.current?.focus(), 0);
                            }}
                            aria-label={`Edit arc ${arc.id}`}
                            className="inline-flex min-h-[32px] items-center gap-1 rounded border border-[var(--border-hairline)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
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
    </section>
  );
};
