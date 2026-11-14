import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { graphToMerkleRecords } from './core/accessibilityOutput';
import { executeAccessibleCommand } from './core/accessibleEditing';
import { createSeedCrdtReplicas, type CrdtReplica } from './core/crdt';
import {
  createSeedRingState,
  type RingKeyEntry,
  type RingNode,
} from './core/hashRing';
import {
  createSeedOcapGraphState,
  type CapabilityToken,
  type GraphArc,
  type GraphNode,
} from './core/ocapGraph';
import {
  createSeedQuorumState,
  type QuorumConfig,
  type QuorumNode,
} from './core/quorum';
import { AccessibleEditConsole } from './components/AccessibleEditConsole';
import { CapabilitiesView } from './components/CapabilitiesView';
import { GraphOcapView } from './components/GraphOcapView';
import { HashRingView } from './components/HashRingView';
import { KeyboardGuideDialog } from './components/KeyboardGuideDialog';
import { LiveAnnouncerPanel } from './components/LiveAnnouncerPanel';
import { SyncQuorumView } from './components/SyncQuorumView';
import { TopBar } from './components/TopBar';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import type {
  AccessibleOutputChannel,
  AuditEvent,
  SystemModuleId,
  ThemeMode,
} from './types/system';

function formatTimestamp(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

const CHANNEL_LABELS: Record<AccessibleOutputChannel, string> = {
  standard: 'Standard',
  braille: 'Braille',
  protactile: 'Protactile',
  asl: 'ASL',
  signwriting: 'SignWriting',
};

export default function App() {
  const [activeModule, setActiveModule] = useState<SystemModuleId>('graph');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [outputChannel, setOutputChannel] = useState<AccessibleOutputChannel>('standard');
  const [signLanguage, setSignLanguage] = useState<string>('asl');
  const [keyboardGuideOpen, setKeyboardGuideOpen] = useState<boolean>(false);
  const [editConsoleFocusSignal, setEditConsoleFocusSignal] = useState<number>(0);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Unified Distributed Graph & Object-Capability Security state
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>(
    () => createSeedOcapGraphState().nodes
  );
  const [graphArcs, setGraphArcs] = useState<GraphArc[]>(
    () => createSeedOcapGraphState().arcs
  );
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(['N1', 'N2']);
  const [selectedArcIds, setSelectedArcIds] = useState<string[]>(['A1']);
  const [capabilities, setCapabilities] = useState<CapabilityToken[]>(
    () => createSeedOcapGraphState().capabilities
  );
  const [activeCapabilityId, setActiveCapabilityId] = useState<string>(
    () => createSeedOcapGraphState().activeCapabilityId
  );

  // Consistent Hash Sharding state
  const [ringNodes, setRingNodes] = useState<RingNode[]>(
    () => createSeedRingState().nodes
  );
  const [ringEntries, setRingEntries] = useState<RingKeyEntry[]>(
    () => createSeedRingState().entries
  );
  const [replicationFactor, setReplicationFactor] = useState<number>(
    () => createSeedRingState().replicationFactor
  );

  // CRDT Replicas state
  const [crdtReplicas, setCrdtReplicas] = useState<CrdtReplica[]>(() =>
    createSeedCrdtReplicas()
  );

  // Merkle Standby Replica B (seeded from initial distributed graph records)
  const [merkleReplicaB, setMerkleReplicaB] = useState<Record<string, string>>(() => {
    const seed = createSeedOcapGraphState();
    return graphToMerkleRecords(seed.nodes, seed.arcs);
  });

  // Quorum state
  const [quorumConfig, setQuorumConfig] = useState<QuorumConfig>(
    () => createSeedQuorumState().config
  );
  const [quorumNodes, setQuorumNodes] = useState<QuorumNode[]>(
    () => createSeedQuorumState().nodes
  );
  const [quorumVersion, setQuorumVersion] = useState<number>(
    () => createSeedQuorumState().latestWrittenVersion
  );

  // Derive healthy shards from Hash Ring physical node status
  const healthyShards = useMemo<Array<'Shard-A' | 'Shard-B' | 'Shard-C'>>(() => {
    const list: Array<'Shard-A' | 'Shard-B' | 'Shard-C'> = [];
    if (ringNodes[0]?.status !== 'offline') list.push('Shard-A');
    if (ringNodes[1]?.status !== 'offline') list.push('Shard-B');
    if (ringNodes[2]?.status !== 'offline') list.push('Shard-C');
    return list.length > 0 ? list : ['Shard-A'];
  }, [ringNodes]);

  // Live Announcer & Audit Log
  const [latestSeverity, setLatestSeverity] = useState<'info' | 'warning' | 'success'>('info');
  const [latestAnnouncement, setLatestAnnouncement] = useState<string>(
    'Initialized distributed graph (5 nodes across 3 shards, 5 arcs) under Root Authority capability.'
  );
  const [events, setEvents] = useState<AuditEvent[]>(() => [
    {
      id: 'init-1',
      timestamp: formatTimestamp(),
      module: 'graph',
      severity: 'info',
      summary:
        'Initialized distributed graph (5 nodes across 3 shards, 5 arcs) under Root Authority capability.',
    },
  ]);

  const announce = useCallback(
    (
      module: SystemModuleId,
      severity: 'info' | 'warning' | 'success',
      summary: string
    ) => {
      setLatestSeverity(severity);
      setLatestAnnouncement(summary);
      setEvents((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: formatTimestamp(),
          module,
          severity,
          summary,
        },
        ...prev.slice(0, 49),
      ]);
    },
    []
  );

  // Sync theme & reduced motion classes on documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast', 'reduced-motion');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'high-contrast') {
      root.classList.add('dark', 'high-contrast');
    }
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    }
  }, [theme, reducedMotion]);

  // Global keyboard shortcuts (Alt+1..4 module switching, ? for Keyboard Guide)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (!inInput && e.key === '?') {
        e.preventDefault();
        lastFocusedRef.current = document.activeElement as HTMLElement | null;
        setKeyboardGuideOpen(true);
        return;
      }

      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveModule('graph');
          announce('graph', 'info', 'Switched to Graph Workspace.');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveModule('sync');
          announce('sync', 'info', 'Switched to Sync & Quorum module.');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveModule('sharding');
          announce('sharding', 'info', 'Switched to Hash Sharding module.');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveModule('capabilities');
          announce('capabilities', 'info', 'Switched to Capabilities Registry.');
        } else if (e.key.toLowerCase() === 'e') {
          e.preventDefault();
          setEditConsoleFocusSignal((n) => n + 1);
          announce(activeModule, 'info', 'Focused Multi-Modal Edit Console.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [announce]);

  const handleOpenKeyboardGuide = () => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setKeyboardGuideOpen(true);
  };

  const handleCloseKeyboardGuide = () => {
    setKeyboardGuideOpen(false);
    setTimeout(() => {
      lastFocusedRef.current?.focus();
    }, 0);
  };

  const handleResetCluster = () => {
    const seedGraph = createSeedOcapGraphState();
    setGraphNodes(seedGraph.nodes);
    setGraphArcs(seedGraph.arcs);
    setSelectedNodeIds(['N1', 'N2']);
    setSelectedArcIds(['A1']);
    setCapabilities(seedGraph.capabilities);
    setActiveCapabilityId(seedGraph.activeCapabilityId);
    setMerkleReplicaB(graphToMerkleRecords(seedGraph.nodes, seedGraph.arcs));

    const seedRing = createSeedRingState();
    setRingNodes(seedRing.nodes);
    setRingEntries(seedRing.entries);
    setReplicationFactor(seedRing.replicationFactor);

    setCrdtReplicas(createSeedCrdtReplicas());

    const seedQuorum = createSeedQuorumState();
    setQuorumConfig(seedQuorum.config);
    setQuorumNodes(seedQuorum.nodes);
    setQuorumVersion(seedQuorum.latestWrittenVersion);

    announce(
      activeModule,
      'info',
      'Reset distributed graph, replicas, shards, and capabilities to deterministic seed state.'
    );
  };

  const handleExecuteAccessibleCommand = (rawCommand: string) => {
    const outcome = executeAccessibleCommand(rawCommand, {
      graphNodes,
      graphArcs,
      selectedNodeIds,
      selectedArcIds,
      capabilities,
      activeCapabilityId,
      ringNodes,
      ringEntries,
      replicationFactor,
      crdtReplicas,
      merkleReplicaB,
      quorumConfig,
      quorumNodes,
      quorumVersion,
    });

    if (outcome.ok) {
      const next = outcome.nextState;
      setGraphNodes(next.graphNodes);
      setGraphArcs(next.graphArcs);
      setSelectedNodeIds(next.selectedNodeIds);
      setSelectedArcIds(next.selectedArcIds);
      setCapabilities(next.capabilities);
      setActiveCapabilityId(next.activeCapabilityId);
      setRingNodes(next.ringNodes);
      setRingEntries(next.ringEntries);
      setReplicationFactor(next.replicationFactor);
      setCrdtReplicas(next.crdtReplicas);
      setMerkleReplicaB(next.merkleReplicaB);
      setQuorumConfig(next.quorumConfig);
      setQuorumNodes(next.quorumNodes);
      setQuorumVersion(next.quorumVersion);
    }

    announce(activeModule, outcome.severity, outcome.summary);
    return {
      ok: outcome.ok,
      summary: outcome.summary,
      decodedCommand: outcome.decodedCommand,
    };
  };

  const handleChangeOutputChannel = (channel: AccessibleOutputChannel) => {
    setOutputChannel(channel);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--accent-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--accent-text-on)]"
      >
        Skip to main content
      </a>

      <TopBar
        activeModule={activeModule}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          announce(mod, 'info', `Switched active view to ${mod.toUpperCase()} module.`);
        }}
        onOpenKeyboardGuide={handleOpenKeyboardGuide}
      />

      <WorkspaceToolbar
        theme={theme}
        onChangeTheme={(nextTheme) => {
          setTheme(nextTheme);
          announce(activeModule, 'info', `Display contrast mode changed to ${nextTheme}.`);
        }}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => {
          const next = !reducedMotion;
          setReducedMotion(next);
          announce(
            activeModule,
            'info',
            `Motion preference set to ${next ? 'Reduced' : 'Standard'}.`
          );
        }}
        outputChannel={outputChannel}
        onChangeOutputChannel={handleChangeOutputChannel}
        onResetCluster={handleResetCluster}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 py-6 sm:px-6"
      >
        <AccessibleEditConsole
          outputChannel={outputChannel}
          nodeIds={graphNodes.map((n) => n.id)}
          arcIds={graphArcs.map((a) => a.id)}
          capabilityIds={capabilities.map((c) => c.id)}
          focusSignal={editConsoleFocusSignal}
          onExecuteCommand={handleExecuteAccessibleCommand}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
          <div className="xl:col-span-9 min-w-0">
            {activeModule === 'graph' && (
              <GraphOcapView
                nodes={graphNodes}
                arcs={graphArcs}
                selectedNodeIds={selectedNodeIds}
                selectedArcIds={selectedArcIds}
                capabilities={capabilities}
                activeCapabilityId={activeCapabilityId}
                healthyShards={healthyShards}
                outputChannelLabel={CHANNEL_LABELS[outputChannel]}
                onChangeSelectedNodes={setSelectedNodeIds}
                onChangeSelectedArcs={setSelectedArcIds}
                onUpdateGraph={(nextNodes, nextArcs) => {
                  setGraphNodes(nextNodes);
                  setGraphArcs(nextArcs);
                }}
                onUpdateCapabilities={(nextCaps, nextActiveId) => {
                  setCapabilities(nextCaps);
                  setActiveCapabilityId(nextActiveId);
                }}
                onOpenCapabilities={() => {
                  setActiveModule('capabilities');
                  announce('capabilities', 'info', 'Opened Capabilities Registry.');
                }}
                onAnnounce={(sev, msg) => announce('graph', sev, msg)}
              />
            )}

            {activeModule === 'sync' && (
              <SyncQuorumView
                graphNodes={graphNodes}
                graphArcs={graphArcs}
                replicas={crdtReplicas}
                onChangeReplicas={setCrdtReplicas}
                merkleReplicaB={merkleReplicaB}
                onChangeMerkleReplicaB={setMerkleReplicaB}
                quorumConfig={quorumConfig}
                quorumNodes={quorumNodes}
                latestWrittenVersion={quorumVersion}
                onUpdateQuorum={(cfg, nextNodes, nextVer) => {
                  setQuorumConfig(cfg);
                  setQuorumNodes(nextNodes);
                  setQuorumVersion(nextVer);
                }}
                onAnnounce={(sev, msg) => announce('sync', sev, msg)}
              />
            )}

            {activeModule === 'sharding' && (
              <HashRingView
                graphNodes={graphNodes}
                nodes={ringNodes}
                entries={ringEntries}
                replicationFactor={replicationFactor}
                onChangeNodes={setRingNodes}
                onChangeEntries={setRingEntries}
                onChangeReplicationFactor={setReplicationFactor}
                onAnnounce={(sev, msg) => announce('sharding', sev, msg)}
              />
            )}

            {activeModule === 'capabilities' && (
              <CapabilitiesView
                nodes={graphNodes}
                capabilities={capabilities}
                activeCapabilityId={activeCapabilityId}
                onUpdateCapabilities={(nextCaps, nextActiveId) => {
                  setCapabilities(nextCaps);
                  setActiveCapabilityId(nextActiveId);
                }}
                onAnnounce={(sev, msg) => announce('capabilities', sev, msg)}
              />
            )}
          </div>

          <div className="xl:col-span-3 xl:sticky xl:top-6 min-w-0">
            <LiveAnnouncerPanel
              activeModule={activeModule}
              latestSeverity={latestSeverity}
              latestAnnouncement={latestAnnouncement}
              outputChannel={outputChannel}
              onChangeOutputChannel={handleChangeOutputChannel}
              signLanguage={signLanguage}
              onChangeSignLanguage={(lang) => {
                setSignLanguage(lang);
              }}
              events={events}
              onClearEvents={() => {
                setEvents([]);
                setLatestSeverity('info');
                setLatestAnnouncement('Cleared operation audit log.');
              }}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-4">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 text-xs text-[var(--text-muted)] sm:px-6">
          <span>Lattice · Accessible Distributed Graph &amp; Object-Capability System</span>
          <span>Braille · Protactile · ASL · International SignWriting · Zero-audio dependency</span>
        </div>
      </footer>

      <KeyboardGuideDialog
        open={keyboardGuideOpen}
        onClose={handleCloseKeyboardGuide}
      />
    </div>
  );
}
