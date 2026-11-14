import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  executeQuorumRead,
  executeQuorumWrite,
  isStrongQuorum,
  type QuorumConfig,
  type QuorumNode,
  type QuorumReadResult,
} from '../core/quorum';

interface QuorumViewProps {
  config: QuorumConfig;
  nodes: QuorumNode[];
  latestWrittenVersion: number;
  onUpdateState: (
    config: QuorumConfig,
    nodes: QuorumNode[],
    latestWrittenVersion: number
  ) => void;
  onAnnounce: (severity: 'info' | 'warning' | 'success', summary: string) => void;
}

export const QuorumView: React.FC<QuorumViewProps> = ({
  config,
  nodes,
  latestWrittenVersion,
  onUpdateState,
  onAnnounce,
}) => {
  const [writeValue, setWriteValue] = useState('v2-release');
  const [writeError, setWriteError] = useState<string | null>(null);
  const [enableReadRepair, setEnableReadRepair] = useState(true);
  const [readOffset, setReadOffset] = useState(2);
  const [lastRead, setLastRead] = useState<QuorumReadResult | null>(null);

  const strongQuorum = useMemo(() => isStrongQuorum(config), [config]);
  const reachableCount = useMemo(
    () => nodes.slice(0, config.n).filter((n) => n.reachable).length,
    [nodes, config.n]
  );

  const handleUpdateW = (w: number) => {
    const nextConfig = { ...config, w };
    onUpdateState(nextConfig, nodes, latestWrittenVersion);
    onAnnounce(
      isStrongQuorum(nextConfig) ? 'success' : 'warning',
      `Set Write Quorum W=${w}. W+R = ${w + config.r} vs N=${config.n} (${
        isStrongQuorum(nextConfig) ? 'Strong consistency guaranteed' : 'Stale reads possible'
      }).`
    );
  };

  const handleUpdateR = (r: number) => {
    const nextConfig = { ...config, r };
    onUpdateState(nextConfig, nodes, latestWrittenVersion);
    onAnnounce(
      isStrongQuorum(nextConfig) ? 'success' : 'warning',
      `Set Read Quorum R=${r}. W+R = ${config.w + r} vs N=${config.n} (${
        isStrongQuorum(nextConfig) ? 'Strong consistency guaranteed' : 'Stale reads possible'
      }).`
    );
  };

  const handleToggleReachable = (nodeId: string) => {
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    const nextReachable = !target.reachable;
    const updated = nodes.map((n) =>
      n.id === nodeId ? { ...n, reachable: nextReachable } : n
    );
    onUpdateState(config, updated, latestWrittenVersion);
    onAnnounce(
      nextReachable ? 'info' : 'warning',
      `${nodeId} marked ${nextReachable ? 'Reachable' : 'Unreachable'}.`
    );
  };

  const handleWrite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeValue.trim()) {
      setWriteError('Enter a payload value before issuing a quorum write.');
      return;
    }
    setWriteError(null);
    const res = executeQuorumWrite(
      nodes,
      config,
      writeValue,
      latestWrittenVersion,
      0
    );
    onUpdateState(config, res.nodes, res.writtenVersion);
    onAnnounce(res.success ? 'success' : 'warning', res.message);
  };

  const handleRead = () => {
    const res = executeQuorumRead(
      nodes,
      config,
      latestWrittenVersion,
      enableReadRepair,
      readOffset
    );
    setLastRead(res);
    if (res.success) {
      onUpdateState(config, res.nodes, latestWrittenVersion);
    }
    onAnnounce(
      !res.success || res.isStaleRead ? 'warning' : 'success',
      res.message
    );
  };

  return (
    <section aria-labelledby="quorum-heading" className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-[var(--border-hairline)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="quorum-heading" className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Quorum Replication Lab (N / W / R)
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Test Dynamo-style strict vs sloppy quorums. When W + R &gt; N, read and write sets overlap on at least one fresh replica.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap shrink-0 ${
            strongQuorum
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-amber-700 dark:text-amber-400'
          }`}
        >
          {strongQuorum ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="font-mono tabular-nums">
            W({config.w}) + R({config.r}) = {config.w + config.r} {strongQuorum ? '>' : '<='} N({config.n}) ·{' '}
            {strongQuorum ? 'Strong Quorum' : 'Stale Read Risk'}
          </span>
        </div>
      </div>

      {/* Controls & Parameters */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Quorum Thresholds
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Cluster size N = {config.n} replicas ({reachableCount} currently reachable).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium">
              <label htmlFor="slider-w" className="text-[var(--text-secondary)]">
                Write Quorum (W)
              </label>
              <span className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                W = {config.w} replicas
              </span>
            </div>
            <input
              id="slider-w"
              type="range"
              min={1}
              max={config.n}
              value={config.w}
              onChange={(e) => handleUpdateW(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--accent-primary)] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium">
              <label htmlFor="slider-r" className="text-[var(--text-secondary)]">
                Read Quorum (R)
              </label>
              <span className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                R = {config.r} replicas
              </span>
            </div>
            <input
              id="slider-r"
              type="range"
              min={1}
              max={config.n}
              value={config.r}
              onChange={(e) => handleUpdateR(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--accent-primary)] cursor-pointer"
            />
          </div>

          <div className="border-t border-[var(--border-hairline)] pt-4 space-y-3">
            <form onSubmit={handleWrite} noValidate className="space-y-2">
              <label
                htmlFor="quorum-write-input"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Write New Value (Starts from Replica 1)
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
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Write (W={config.w})</span>
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
                <span>Enable Read-Repair on stale responders</span>
              </label>

              <div className="flex items-center gap-2">
                <label htmlFor="read-offset-select" className="text-xs text-[var(--text-muted)]">
                  Coordinator
                </label>
                <select
                  id="read-offset-select"
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
                  onClick={handleRead}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Read (R={config.r})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Replica Versions & Read Outcome */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Replica State Table
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Latest global committed version: <strong className="font-mono">v{latestWrittenVersion}</strong>
                </p>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-muted)]">
                    <th scope="col" className="py-2 pr-3">Replica</th>
                    <th scope="col" className="py-2 pr-3">Version</th>
                    <th scope="col" className="py-2 pr-3">Stored Value</th>
                    <th scope="col" className="py-2 pr-3">Freshness</th>
                    <th scope="col" className="py-2 text-right">Network</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {nodes.map((node) => {
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
                            aria-label={
                              node.reachable
                                ? `Disconnect ${node.id}`
                                : `Reconnect ${node.id}`
                            }
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
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
                Last Quorum Read Inspection
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{lastRead.message}</p>
              {lastRead.success && (
                <dl className="mt-3 flex flex-wrap gap-6 text-xs">
                  <div>
                    <dt className="text-[var(--text-muted)]">Responders</dt>
                    <dd className="font-mono font-semibold text-[var(--text-primary)]">
                      {lastRead.respondedNodeIds.join(', ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Returned Version</dt>
                    <dd className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                      v{lastRead.returnedVersion} (Latest: v{lastRead.latestClusterVersion})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Read-Repaired Nodes</dt>
                    <dd className="font-mono font-semibold text-[var(--text-primary)]">
                      {lastRead.repairedNodeIds.length > 0
                        ? lastRead.repairedNodeIds.join(', ')
                        : 'None'}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
