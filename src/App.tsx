import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  graphToMerkleRecords,
  resolveBrailleProfile,
  resolveDeafblindProfile,
} from './core/accessibilityOutput';
import { findAccessibilityLanguageOption } from './core/accessibilityLanguages';
import { executeAccessibleCommand } from './core/accessibleEditing';
import { createSeedCrdtReplicas, type CrdtReplica } from './core/crdt';
import {
  createSeedRingState,
  type RingKeyEntry,
  type RingNode,
} from './core/hashRing';
import {
  formatUi,
  resolveUiLocale,
  resolveUiLocaleForOutputSelection,
  translateUi,
  type SupportedUiLocale,
} from './core/i18n';
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
import { resolveSignLanguage } from './core/signWriting';
import { AccessibleEditConsole } from './components/AccessibleEditConsole';
import { CapabilitiesView } from './components/CapabilitiesView';
import { GraphOcapView } from './components/GraphOcapView';
import { HashRingView } from './components/HashRingView';
import { KeyboardGuideDialog } from './components/KeyboardGuideDialog';
import { LanguageTestDialog } from './components/LanguageTestDialog';
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

export default function App() {
  const [activeModule, setActiveModule] = useState<SystemModuleId>('graph');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [outputChannel, setOutputChannel] = useState<AccessibleOutputChannel>('standard');
  const [uiLocale, setUiLocale] = useState<SupportedUiLocale>('en');
  const [signLanguage, setSignLanguage] = useState<string>('asl');
  const [brailleProfileId, setBrailleProfileId] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem('ocg-dds-braille-profile');
      if (saved) return resolveBrailleProfile(saved).id;
      const legacy = window.localStorage.getItem('ocg-dds-accessibility-profile');
      const legacyOpt = legacy ? findAccessibilityLanguageOption(legacy) : undefined;
      if (legacyOpt?.kind === 'braille') return legacyOpt.id;
      return 'braille-ueb';
    } catch {
      return 'braille-ueb';
    }
  });
  const [deafblindProfileId, setDeafblindProfileId] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem('ocg-dds-deafblind-profile');
      if (saved) return resolveDeafblindProfile(saved).id;
      const legacy = window.localStorage.getItem('ocg-dds-accessibility-profile');
      const legacyOpt = legacy ? findAccessibilityLanguageOption(legacy) : undefined;
      if (legacyOpt?.kind === 'deafblind') return legacyOpt.id;
      return 'db-protactile';
    } catch {
      return 'db-protactile';
    }
  });
  const [keyboardGuideOpen, setKeyboardGuideOpen] = useState<boolean>(false);
  const [languageLabOpen, setLanguageLabOpen] = useState<boolean>(false);
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
      timestampMs: Date.now(),
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
          timestampMs: Date.now(),
          module,
          severity,
          summary,
        },
        ...prev.slice(0, 49),
      ]);
    },
    []
  );

  useEffect(() => {
    try {
      window.localStorage.setItem('ocg-dds-braille-profile', brailleProfileId);
      window.localStorage.setItem('ocg-dds-deafblind-profile', deafblindProfileId);
    } catch {
      // Storage may be unavailable in private or restricted browsing contexts.
    }
  }, [brailleProfileId, deafblindProfileId]);

  // Sync theme, reduced motion, language, RTL/LTR direction, title, and meta description
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
    const localeSpec = resolveUiLocale(uiLocale);
    root.lang = localeSpec.code;
    root.dir = localeSpec.dir;
    document.title = translateUi(uiLocale, 'appTitle');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', translateUi(uiLocale, 'appDescription'));
    }
  }, [theme, reducedMotion, uiLocale]);

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
          announce(
            'graph',
            'info',
            formatUi(uiLocale, 'eventSwitchedModule', {
              module: translateUi(uiLocale, 'navGraph'),
            })
          );
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveModule('sync');
          announce(
            'sync',
            'info',
            formatUi(uiLocale, 'eventSwitchedModule', {
              module: translateUi(uiLocale, 'navSync'),
            })
          );
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveModule('sharding');
          announce(
            'sharding',
            'info',
            formatUi(uiLocale, 'eventSwitchedModule', {
              module: translateUi(uiLocale, 'navSharding'),
            })
          );
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveModule('capabilities');
          announce(
            'capabilities',
            'info',
            formatUi(uiLocale, 'eventSwitchedModule', {
              module: translateUi(uiLocale, 'navCapabilities'),
            })
          );
        } else if (e.key.toLowerCase() === 'e') {
          e.preventDefault();
          setEditConsoleFocusSignal((n) => n + 1);
          announce(activeModule, 'info', translateUi(uiLocale, 'eventFocusedConsole'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [announce, activeModule, uiLocale]);

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
      translateUi(uiLocale, 'eventResetCluster')
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

  const handleSelectOutputVariant = (variantKey: string) => {
    const sep = variantKey.indexOf(':');
    if (sep === -1) return;
    const channel = variantKey.slice(0, sep) as AccessibleOutputChannel;
    const value = variantKey.slice(sep + 1);

    if (channel === 'standard') {
      const nextLocale =
        value === 'standard' ? uiLocale : resolveUiLocale(value).code;
      setUiLocale(nextLocale);
      setOutputChannel('standard');
      const spec = resolveUiLocale(nextLocale);
      announce(
        activeModule,
        'info',
        formatUi(nextLocale, 'eventChangedLanguage', {
          language: spec.nativeName,
          code: spec.code,
        })
      );
    } else if (channel === 'braille') {
      const profile = resolveBrailleProfile(value);
      setBrailleProfileId(profile.id);
      setOutputChannel('braille');
      announce(
        activeModule,
        'info',
        `Braille display profile set to ${profile.name} (${profile.code}). ${profile.description}`
      );
    } else if (channel === 'protactile') {
      const profile = resolveDeafblindProfile(value);
      setDeafblindProfileId(profile.id);
      setOutputChannel('protactile');
      announce(
        activeModule,
        'info',
        `DeafBlind / Tactile method set to ${profile.name} (${profile.code}). ${profile.description}`
      );
    } else if (channel === 'asl' || channel === 'signwriting') {
      const spec = resolveSignLanguage(value);
      setSignLanguage(value);
      setOutputChannel(channel);
      announce(
        activeModule,
        'info',
        `${channel === 'signwriting' ? 'SignWriting' : 'Sign Language'} switched to ${spec.name} (${spec.code}, ${spec.syntaxOrder.toUpperCase()}).`
      );
    }
  };

  const outputChannelLabel = useMemo(() => {
    switch (outputChannel) {
      case 'braille':
        return `${translateUi(uiLocale, 'channelBraille')} · ${resolveBrailleProfile(brailleProfileId).code}`;
      case 'protactile':
        return `${translateUi(uiLocale, 'channelProtactile')} · ${resolveDeafblindProfile(deafblindProfileId).code}`;
      case 'asl':
        return `${translateUi(uiLocale, 'channelAsl')} · ${resolveSignLanguage(signLanguage).code}`;
      case 'signwriting':
        return `${translateUi(uiLocale, 'channelSignWriting')} · ${resolveSignLanguage(signLanguage).code}`;
      default:
        return `${translateUi(uiLocale, 'channelStandard')} · ${resolveUiLocale(uiLocale).code.toUpperCase()}`;
    }
  }, [outputChannel, uiLocale, brailleProfileId, deafblindProfileId, signLanguage]);

  const handleOpenLanguageLab = () => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const targetLocale = resolveUiLocaleForOutputSelection(
      outputChannel,
      uiLocale,
      brailleProfileId,
      deafblindProfileId,
      signLanguage
    );
    if (targetLocale !== uiLocale) {
      setUiLocale(targetLocale);
      const spec = resolveUiLocale(targetLocale);
      const localizedInit = translateUi(targetLocale, 'eventInitGraph');
      setEvents((prev) =>
        prev.map((ev) => (ev.id === 'init-1' ? { ...ev, summary: localizedInit } : ev))
      );
      announce(
        activeModule,
        'info',
        formatUi(targetLocale, 'eventChangedLanguage', {
          language: spec.nativeName,
          code: spec.code,
        })
      );
    }
    setLanguageLabOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--accent-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--accent-text-on)]"
      >
        {translateUi(uiLocale, 'skipToMain')}
      </a>

      <TopBar
        activeModule={activeModule}
        uiLocale={uiLocale}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          const moduleKey =
            mod === 'graph'
              ? 'navGraph'
              : mod === 'sync'
                ? 'navSync'
                : mod === 'sharding'
                  ? 'navSharding'
                  : 'navCapabilities';
          announce(
            mod,
            'info',
            formatUi(uiLocale, 'eventSwitchedModule', {
              module: translateUi(uiLocale, moduleKey),
            })
          );
        }}
        onOpenKeyboardGuide={handleOpenKeyboardGuide}
      />

      <WorkspaceToolbar
        theme={theme}
        onChangeTheme={(nextTheme) => {
          setTheme(nextTheme);
          const themeKey =
            nextTheme === 'dark'
              ? 'themeDark'
              : nextTheme === 'high-contrast'
                ? 'themeHighContrast'
                : 'themeLight';
          announce(
            activeModule,
            'info',
            formatUi(uiLocale, 'eventChangedTheme', {
              theme: translateUi(uiLocale, themeKey),
            })
          );
        }}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => {
          const next = !reducedMotion;
          setReducedMotion(next);
          announce(
            activeModule,
            'info',
            formatUi(uiLocale, 'eventChangedMotion', {
              mode: translateUi(uiLocale, next ? 'motionReduced' : 'motionStandard'),
            })
          );
        }}
        outputChannel={outputChannel}
        brailleProfileId={brailleProfileId}
        deafblindProfileId={deafblindProfileId}
        signLanguage={signLanguage}
        onChangeOutputChannel={handleChangeOutputChannel}
        onSelectOutputVariant={handleSelectOutputVariant}
        uiLocale={uiLocale}
        onOpenLanguageLab={handleOpenLanguageLab}
        onResetCluster={handleResetCluster}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 py-6 sm:px-6"
      >
        <AccessibleEditConsole
          outputChannel={outputChannel}
          uiLocale={uiLocale}
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
                outputChannelLabel={outputChannelLabel}
                uiLocale={uiLocale}
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
                  announce(
                    'capabilities',
                    'info',
                    translateUi(uiLocale, 'eventOpenedCapabilities')
                  );
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
                uiLocale={uiLocale}
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
                uiLocale={uiLocale}
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
                uiLocale={uiLocale}
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
              brailleProfileId={brailleProfileId}
              deafblindProfileId={deafblindProfileId}
              signLanguage={signLanguage}
              onSelectOutputVariant={handleSelectOutputVariant}
              uiLocale={uiLocale}
              events={events}
              onClearEvents={() => {
                setEvents([]);
                setLatestSeverity('info');
                setLatestAnnouncement(translateUi(uiLocale, 'eventClearedLog'));
              }}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-4">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 text-xs text-[var(--text-muted)] sm:px-6">
          <span>{translateUi(uiLocale, 'footerSystem')}</span>
          <span>{translateUi(uiLocale, 'footerCapabilities')}</span>
        </div>
      </footer>

      <KeyboardGuideDialog
        open={keyboardGuideOpen}
        uiLocale={uiLocale}
        onClose={handleCloseKeyboardGuide}
      />

      <LanguageTestDialog
        open={languageLabOpen}
        uiLocale={uiLocale}
        outputChannel={outputChannel}
        brailleProfileId={brailleProfileId}
        deafblindProfileId={deafblindProfileId}
        signLanguage={signLanguage}
        onChangeUiLocale={(nextLocale, pairSign) => {
          setUiLocale(nextLocale);
          if (pairSign) {
            setSignLanguage(resolveUiLocale(nextLocale).recommendedSignLanguage);
          }
        }}
        onChangeOutputChannel={handleChangeOutputChannel}
        onChangeBrailleProfile={setBrailleProfileId}
        onChangeDeafblindProfile={setDeafblindProfileId}
        onChangeSignLanguage={(lang) => setSignLanguage(lang)}
        onDispatchSampleEvent={(sev, summary) => {
          announce(activeModule, sev, summary);
        }}
        onClose={() => {
          setLanguageLabOpen(false);
          setTimeout(() => {
            lastFocusedRef.current?.focus();
          }, 0);
        }}
      />
    </div>
  );
}
