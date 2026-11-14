import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createSeedCrdtReplicas, type CrdtReplica } from './core/crdt';
import {
  createSeedRingState,
  type RingKeyEntry,
  type RingNode,
} from './core/hashRing';
import { createSeedMerkleRecords } from './core/merkle';
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
import { CrdtView } from './components/CrdtView';
import { GraphOcapView } from './components/GraphOcapView';
import { HashRingView } from './components/HashRingView';
import { KeyboardGuideDialog } from './components/KeyboardGuideDialog';
import { LiveAnnouncerPanel } from './components/LiveAnnouncerPanel';
import { MerkleView } from './components/MerkleView';
import { QuorumView } from './components/QuorumView';
import { TopBar } from './components/TopBar';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import type { AuditEvent, SystemModuleId, ThemeMode } from './types/system';

function formatTimestamp(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

export default function App() {
  const [activeModule, setActiveModule] = useState<SystemModuleId>('graph');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [brailleMode, setBrailleMode] = useState<boolean>(false);
  const [keyboardGuideOpen, setKeyboardGuideOpen] = useState<boolean>(false);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Module 0: Distributed Graph & Object-Capability Security state
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>(
    () => createSeedOcapGraphState().nodes
  );
  const [graphArcs, setGraphArcs] = useState<GraphArc[]>(
    () => createSeedOcapGraphState().arcs
  );
  const [capabilities, setCapabilities] = useState<CapabilityToken[]>(
    () => createSeedOcapGraphState().capabilities
  );
  const [activeCapabilityId, setActiveCapabilityId] = useState<string>(
    () => createSeedOcapGraphState().activeCapabilityId
  );

  // Module 1: Consistent Hash Ring state
  const [ringNodes, setRingNodes] = useState<RingNode[]>(
    () => createSeedRingState().nodes
  );
  const [ringEntries, setRingEntries] = useState<RingKeyEntry[]>(
    () => createSeedRingState().entries
  );
  const [replicationFactor, setReplicationFactor] = useState<number>(
    () => createSeedRingState().replicationFactor
  );

  // Module 2: CRDT Replicas state
  const [crdtReplicas, setCrdtReplicas] = useState<CrdtReplica[]>(() =>
    createSeedCrdtReplicas()
  );

  // Module 3: Merkle Anti-Entropy state
  const [merkleA, setMerkleA] = useState<Record<string, string>>(
    () => createSeedMerkleRecords().replicaA
  );
  const [merkleB, setMerkleB] = useState<Record<string, string>>(
    () => createSeedMerkleRecords().replicaB
  );

  // Module 4: Quorum Lab state
  const [quorumConfig, setQuorumConfig] = useState<QuorumConfig>(
    () => createSeedQuorumState().config
  );
  const [quorumNodes, setQuorumNodes] = useState<QuorumNode[]>(
    () => createSeedQuorumState().nodes
  );
  const [quorumVersion, setQuorumVersion] = useState<number>(
    () => createSeedQuorumState().latestWrittenVersion
  );

  // Live Announcer & Audit Log
  const [latestSeverity, setLatestSeverity] = useState<'info' | 'warning' | 'success'>('info');
  const [latestAnnouncement, setLatestAnnouncement] = useState<string>(
    'Initialized 5 graph nodes, 5 arcs, 3 OCap tokens, 4 hash ring nodes, 3 CRDT replicas, Merkle trees, and a 5-node quorum.'
  );
  const [events, setEvents] = useState<AuditEvent[]>(() => [
    {
      id: 'init-1',
      timestamp: formatTimestamp(),
      module: 'graph',
      severity: 'info',
      summary: 'Initialized distributed graph (5 nodes, 5 arcs) under Root Authority capability.',
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

  // Global keyboard shortcuts (Alt+1..5 module switching, ? for Keyboard Guide)
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
          announce('graph', 'info', 'Switched to Graph & OCap module.');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveModule('ring');
          announce('ring', 'info', 'Switched to Consistent Hash Ring module.');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveModule('crdt');
          announce('crdt', 'info', 'Switched to CRDT Replicas module.');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveModule('merkle');
          announce('merkle', 'info', 'Switched to Merkle Sync module.');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveModule('quorum');
          announce('quorum', 'info', 'Switched to Quorum Lab module.');
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
    setCapabilities(seedGraph.capabilities);
    setActiveCapabilityId(seedGraph.activeCapabilityId);

    const seedRing = createSeedRingState();
    setRingNodes(seedRing.nodes);
    setRingEntries(seedRing.entries);
    setReplicationFactor(seedRing.replicationFactor);

    setCrdtReplicas(createSeedCrdtReplicas());

    const seedMerkle = createSeedMerkleRecords();
    setMerkleA(seedMerkle.replicaA);
    setMerkleB(seedMerkle.replicaB);

    const seedQuorum = createSeedQuorumState();
    setQuorumConfig(seedQuorum.config);
    setQuorumNodes(seedQuorum.nodes);
    setQuorumVersion(seedQuorum.latestWrittenVersion);

    announce(activeModule, 'info', 'Reset all cluster structures and capabilities to deterministic seed state.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Skip to main content link for keyboard, Braille, and screen reader users */}
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
        brailleMode={brailleMode}
        onToggleBrailleMode={() => {
          const next = !brailleMode;
          setBrailleMode(next);
          announce(
            activeModule,
            'info',
            `Braille 40-cell linear output mode ${next ? 'enabled' : 'disabled'}.`
          );
        }}
        onResetCluster={handleResetCluster}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6"
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
          <div className="xl:col-span-9 min-w-0">
            {activeModule === 'graph' && (
              <GraphOcapView
                nodes={graphNodes}
                arcs={graphArcs}
                capabilities={capabilities}
                activeCapabilityId={activeCapabilityId}
                brailleMode={brailleMode}
                onUpdateGraph={(nextNodes, nextArcs) => {
                  setGraphNodes(nextNodes);
                  setGraphArcs(nextArcs);
                }}
                onUpdateCapabilities={(nextCaps, nextActiveId) => {
                  setCapabilities(nextCaps);
                  setActiveCapabilityId(nextActiveId);
                }}
                onAnnounce={(sev, msg) => announce('graph', sev, msg)}
              />
            )}

            {activeModule === 'ring' && (
              <HashRingView
                nodes={ringNodes}
                entries={ringEntries}
                replicationFactor={replicationFactor}
                onChangeNodes={setRingNodes}
                onChangeEntries={setRingEntries}
                onChangeReplicationFactor={setReplicationFactor}
                onAnnounce={(sev, msg) => announce('ring', sev, msg)}
              />
            )}

            {activeModule === 'crdt' && (
              <CrdtView
                replicas={crdtReplicas}
                onChangeReplicas={setCrdtReplicas}
                onAnnounce={(sev, msg) => announce('crdt', sev, msg)}
              />
            )}

            {activeModule === 'merkle' && (
              <MerkleView
                replicaA={merkleA}
                replicaB={merkleB}
                onChangeReplicaB={setMerkleB}
                onAnnounce={(sev, msg) => announce('merkle', sev, msg)}
              />
            )}

            {activeModule === 'quorum' && (
              <QuorumView
                config={quorumConfig}
                nodes={quorumNodes}
                latestWrittenVersion={quorumVersion}
                onUpdateState={(cfg, nextNodes, nextVer) => {
                  setQuorumConfig(cfg);
                  setQuorumNodes(nextNodes);
                  setQuorumVersion(nextVer);
                }}
                onAnnounce={(sev, msg) => announce('quorum', sev, msg)}
              />
            )}
          </div>

          <div className="xl:col-span-3 xl:sticky xl:top-6">
            <LiveAnnouncerPanel
              activeModule={activeModule}
              latestSeverity={latestSeverity}
              latestAnnouncement={latestAnnouncement}
              brailleMode={brailleMode}
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
          <span>Lattice · Accessible Distributed Data Structure System</span>
          <span>Deaf-blind Braille ready · Object-Capability enforced · Zero-audio dependency</span>
        </div>
      </footer>

      <KeyboardGuideDialog
        open={keyboardGuideOpen}
        onClose={handleCloseKeyboardGuide}
      />
    </div>
  );
}
