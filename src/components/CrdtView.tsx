import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
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

interface CrdtViewProps {
  replicas: CrdtReplica[];
  onChangeReplicas: (replicas: CrdtReplica[]) => void;
  onAnnounce: (severity: 'info' | 'warning' | 'success', summary: string) => void;
}

export const CrdtView: React.FC<CrdtViewProps> = ({
  replicas,
  onChangeReplicas,
  onAnnounce,
}) => {
  const [targetReplicaId, setTargetReplicaId] = useState(replicas[0]?.id ?? 'R1');
  const [orSetItemInput, setOrSetItemInput] = useState('');
  const [lwwKeyInput, setLwwKeyInput] = useState('');
  const [lwwValueInput, setLwwValueInput] = useState('');
  const [crdtError, setCrdtError] = useState<string | null>(null);
  const [opCounter, setOpCounter] = useState(100);

  const converged = useMemo(() => areReplicasConverged(replicas), [replicas]);
  const anyPartitioned = useMemo(
    () => replicas.some((r) => r.partitioned),
    [replicas]
  );

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
        ? `${replicaId} is now Partitioned from gossip sync. Local writes will diverge until healed.`
        : `${replicaId} reconnected to network. Run Heal & Gossip Sync to merge causal state.`
    );
  };

  const handleAddOrSet = (e: React.FormEvent) => {
    e.preventDefault();
    const item = orSetItemInput.trim();
    if (!item) {
      setCrdtError('Enter a set element name before adding to the OR-Set.');
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
    onAnnounce(
      'info',
      `Added OR-Set element "${item}" on ${targetReplicaId}.`
    );
  };

  const handleRemoveOrSet = (replicaId: string, item: string) => {
    const updated = replicas.map((r) =>
      r.id === replicaId ? removeOrSetItem(r, item) : r
    );
    onChangeReplicas(updated);
    onAnnounce(
      'info',
      `Removed OR-Set element "${item}" on ${replicaId} (causal tags tombstoned).`
    );
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
    onAnnounce(
      'info',
      `Updated LWW register "${key}" = "${val}" on ${targetReplicaId}.`
    );
  };

  const handleGossipSync = () => {
    // Heal all partitions and run full state-based join
    const healed = replicas.map((r) => ({ ...r, partitioned: false }));
    const synced = gossipConvergeAll(healed);
    onChangeReplicas(synced);
    onAnnounce(
      'success',
      'Healed network partitions and completed CRDT state-based gossip merge. All replicas converged.'
    );
  };

  return (
    <section aria-labelledby="crdt-heading" className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-[var(--border-hairline)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="crdt-heading" className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            CRDT Replicas and Vector Clocks
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Simulate split-brain writes on Observed-Remove Sets and Last-Write-Wins Registers, then prove Strong Eventual Consistency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 sm:flex-nowrap">
          <div
            className={`inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap ${
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
            <span>{converged ? 'State: Converged' : 'State: Divergent'}</span>
          </div>

          <button
            type="button"
            onClick={handleGossipSync}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <GitMerge className="h-4 w-4" aria-hidden="true" />
            <span>{anyPartitioned ? 'Heal & Sync All' : 'Gossip Sync All'}</span>
          </button>
        </div>
      </div>

      {/* Mutation Controls */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-64">
            <label
              htmlFor="crdt-target-replica"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Target Replica for Local Mutation
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
            <div className="min-w-[180px] flex-1">
              <label
                htmlFor="crdt-orset-input"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Add Element to OR-Set (Add-Wins)
              </label>
              <input
                id="crdt-orset-input"
                type="text"
                value={orSetItemInput}
                onChange={(e) => {
                  setOrSetItemInput(e.target.value);
                  if (crdtError) setCrdtError(null);
                }}
                placeholder="e.g. quota:high"
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add to Set</span>
            </button>
          </form>

          <form onSubmit={handleSetLww} noValidate className="flex flex-1 flex-wrap items-end gap-2">
            <div className="min-w-[120px] flex-1">
              <label
                htmlFor="crdt-lww-key"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                LWW Register Key
              </label>
              <input
                id="crdt-lww-key"
                type="text"
                value={lwwKeyInput}
                onChange={(e) => {
                  setLwwKeyInput(e.target.value);
                  if (crdtError) setCrdtError(null);
                }}
                placeholder="max_connections"
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
            <div className="min-w-[110px] flex-1">
              <label
                htmlFor="crdt-lww-val"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                New Value
              </label>
              <input
                id="crdt-lww-val"
                type="text"
                value={lwwValueInput}
                onChange={(e) => {
                  setLwwValueInput(e.target.value);
                  if (crdtError) setCrdtError(null);
                }}
                placeholder="4096"
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] whitespace-nowrap shrink-0 cursor-pointer"
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

      {/* Replica Nodes Grid */}
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
                  className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {replica.partitioned ? 'Reconnect' : 'Partition'}
                </button>
              </div>

              {/* Vector Clock & Lamport Clock */}
              <div className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center justify-between">
                  <span>Vector Clock</span>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {formatVectorClock(replica.vectorClock)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lamport Clock / Relation to R1</span>
                  <span className="font-mono">
                    t={replica.lamportClock} · {relationToPrimary}
                  </span>
                </div>
              </div>

              {/* OR-Set Elements */}
              <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                  OR-Set Members ({activeItems.length})
                </h3>
                {activeItems.length === 0 ? (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    No active elements in set.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {activeItems.map((item) => (
                      <li
                        key={item}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-mono text-[var(--text-primary)]">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOrSet(replica.id, item)}
                          aria-label={`Remove ${item} from ${replica.id}`}
                          className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[var(--border-hairline)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* LWW-Register Map */}
              <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                  LWW-Register Map ({lwwEntries.length})
                </h3>
                <dl className="mt-2 space-y-1.5 text-xs">
                  {lwwEntries.map((entry) => (
                    <div
                      key={entry.key}
                      className="flex items-center justify-between gap-2"
                    >
                      <dt className="font-mono text-[var(--text-secondary)]">
                        {entry.key}
                      </dt>
                      <dd className="font-mono font-semibold text-[var(--text-primary)]">
                        {entry.value}{' '}
                        <span className="font-normal text-[var(--text-muted)]">
                          (t={entry.timestamp}, {entry.writerId})
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
