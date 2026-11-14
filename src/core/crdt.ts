export type VectorClock = Record<string, number>;

export type ClockRelation = 'equal' | 'before' | 'after' | 'concurrent';

export interface OrSetElement {
  item: string;
  addTags: string[];
  removeTags: string[];
}

export interface LwwEntry {
  key: string;
  value: string;
  timestamp: number;
  writerId: string;
}

export interface CrdtReplica {
  id: string;
  label: string;
  partitioned: boolean;
  vectorClock: VectorClock;
  lamportClock: number;
  orSet: Record<string, OrSetElement>;
  lwwMap: Record<string, LwwEntry>;
}

export function compareVectorClocks(a: VectorClock, b: VectorClock): ClockRelation {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aLessOrEqual = true;
  let bLessOrEqual = true;
  let strictlyDifferent = false;

  for (const k of keys) {
    const va = a[k] ?? 0;
    const vb = b[k] ?? 0;
    if (va < vb) {
      bLessOrEqual = false;
      strictlyDifferent = true;
    } else if (va > vb) {
      aLessOrEqual = false;
      strictlyDifferent = true;
    }
  }

  if (!strictlyDifferent) return 'equal';
  if (aLessOrEqual) return 'before';
  if (bLessOrEqual) return 'after';
  return 'concurrent';
}

export function mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const merged: VectorClock = {};
  for (const k of keys) {
    merged[k] = Math.max(a[k] ?? 0, b[k] ?? 0);
  }
  return merged;
}

export function formatVectorClock(vc: VectorClock): string {
  const entries = Object.entries(vc).sort(([a], [b]) => a.localeCompare(b));
  return '[' + entries.map(([k, v]) => `${k}:${v}`).join(', ') + ']';
}

export function getActiveOrSetItems(replica: CrdtReplica): string[] {
  return Object.values(replica.orSet)
    .filter((el) => {
      const removed = new Set(el.removeTags);
      return el.addTags.some((tag) => !removed.has(tag));
    })
    .map((el) => el.item)
    .sort((a, b) => a.localeCompare(b));
}

export function addOrSetItem(
  replica: CrdtReplica,
  rawItem: string,
  opSeq: number
): CrdtReplica {
  const item = rawItem.trim();
  if (!item) return replica;

  const nextClock = (replica.vectorClock[replica.id] ?? 0) + 1;
  const nextLamport = replica.lamportClock + 1;
  const uniqueTag = `${replica.id}@${nextClock}.${opSeq}`;

  const existing = replica.orSet[item] ?? {
    item,
    addTags: [],
    removeTags: [],
  };

  return {
    ...replica,
    vectorClock: {
      ...replica.vectorClock,
      [replica.id]: nextClock,
    },
    lamportClock: nextLamport,
    orSet: {
      ...replica.orSet,
      [item]: {
        item,
        addTags: [...existing.addTags, uniqueTag],
        removeTags: [...existing.removeTags],
      },
    },
  };
}

export function removeOrSetItem(replica: CrdtReplica, rawItem: string): CrdtReplica {
  const item = rawItem.trim();
  const existing = replica.orSet[item];
  if (!existing) return replica;

  const nextClock = (replica.vectorClock[replica.id] ?? 0) + 1;
  const nextLamport = replica.lamportClock + 1;
  const mergedRemoves = Array.from(
    new Set([...existing.removeTags, ...existing.addTags])
  );

  return {
    ...replica,
    vectorClock: {
      ...replica.vectorClock,
      [replica.id]: nextClock,
    },
    lamportClock: nextLamport,
    orSet: {
      ...replica.orSet,
      [item]: {
        item,
        addTags: [...existing.addTags],
        removeTags: mergedRemoves,
      },
    },
  };
}

export function setLwwRegister(
  replica: CrdtReplica,
  rawKey: string,
  value: string
): CrdtReplica {
  const key = rawKey.trim();
  if (!key) return replica;

  const nextClock = (replica.vectorClock[replica.id] ?? 0) + 1;
  const nextLamport = replica.lamportClock + 1;

  return {
    ...replica,
    vectorClock: {
      ...replica.vectorClock,
      [replica.id]: nextClock,
    },
    lamportClock: nextLamport,
    lwwMap: {
      ...replica.lwwMap,
      [key]: {
        key,
        value,
        timestamp: nextLamport,
        writerId: replica.id,
      },
    },
  };
}

/**
 * State-based CRDT join (commutative, associative, idempotent).
 * Add-wins semantics for OR-Set; Lamport timestamp + deterministic node ID tie-break for LWW-Map.
 */
export function mergeReplicaState(target: CrdtReplica, source: CrdtReplica): CrdtReplica {
  const mergedClock = mergeVectorClocks(target.vectorClock, source.vectorClock);
  const mergedLamport = Math.max(target.lamportClock, source.lamportClock);

  const allItems = new Set([
    ...Object.keys(target.orSet),
    ...Object.keys(source.orSet),
  ]);
  const mergedOrSet: Record<string, OrSetElement> = {};
  for (const item of allItems) {
    const tEl = target.orSet[item];
    const sEl = source.orSet[item];
    mergedOrSet[item] = {
      item,
      addTags: Array.from(
        new Set([...(tEl?.addTags ?? []), ...(sEl?.addTags ?? [])])
      ).sort(),
      removeTags: Array.from(
        new Set([...(tEl?.removeTags ?? []), ...(sEl?.removeTags ?? [])])
      ).sort(),
    };
  }

  const allKeys = new Set([
    ...Object.keys(target.lwwMap),
    ...Object.keys(source.lwwMap),
  ]);
  const mergedLww: Record<string, LwwEntry> = {};
  for (const k of allKeys) {
    const tEntry = target.lwwMap[k];
    const sEntry = source.lwwMap[k];
    if (!tEntry && sEntry) {
      mergedLww[k] = { ...sEntry };
    } else if (tEntry && !sEntry) {
      mergedLww[k] = { ...tEntry };
    } else if (tEntry && sEntry) {
      if (sEntry.timestamp > tEntry.timestamp) {
        mergedLww[k] = { ...sEntry };
      } else if (sEntry.timestamp < tEntry.timestamp) {
        mergedLww[k] = { ...tEntry };
      } else {
        // Deterministic tie-breaker on writerId lexicographic order
        mergedLww[k] =
          sEntry.writerId.localeCompare(tEntry.writerId) >= 0
            ? { ...sEntry }
            : { ...tEntry };
      }
    }
  }

  return {
    ...target,
    vectorClock: mergedClock,
    lamportClock: mergedLamport,
    orSet: mergedOrSet,
    lwwMap: mergedLww,
  };
}

export function gossipConvergeAll(replicas: CrdtReplica[]): CrdtReplica[] {
  const reachable = replicas.filter((r) => !r.partitioned);
  if (reachable.length <= 1) return replicas;

  let accumulated = reachable[0];
  for (let i = 1; i < reachable.length; i++) {
    accumulated = mergeReplicaState(accumulated, reachable[i]);
  }

  return replicas.map((r) => {
    if (r.partitioned) return r;
    return mergeReplicaState(r, accumulated);
  });
}

export function areReplicasConverged(replicas: CrdtReplica[]): boolean {
  if (replicas.length <= 1) return true;
  const baselineItems = JSON.stringify(getActiveOrSetItems(replicas[0]));
  const baselineMap = JSON.stringify(
    Object.entries(replicas[0].lwwMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, v.value])
  );

  for (let i = 1; i < replicas.length; i++) {
    const items = JSON.stringify(getActiveOrSetItems(replicas[i]));
    const map = JSON.stringify(
      Object.entries(replicas[i].lwwMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, v.value])
    );
    if (items !== baselineItems || map !== baselineMap) {
      return false;
    }
  }
  return true;
}

export function createSeedCrdtReplicas(): CrdtReplica[] {
  const baseIds = ['R1', 'R2', 'R3'];
  const baseLabels: Record<string, string> = {
    R1: 'Replica R1 (Primary US)',
    R2: 'Replica R2 (EU Edge)',
    R3: 'Replica R3 (AP Edge)',
  };

  let replicas: CrdtReplica[] = baseIds.map((id) => ({
    id,
    label: baseLabels[id],
    partitioned: false,
    vectorClock: { R1: 0, R2: 0, R3: 0 },
    lamportClock: 0,
    orSet: {},
    lwwMap: {},
  }));

  replicas[0] = addOrSetItem(replicas[0], 'feature:dark-mode', 1);
  replicas[0] = addOrSetItem(replicas[0], 'region:eu-ready', 2);
  replicas[0] = setLwwRegister(replicas[0], 'max_connections', '2500');
  replicas[0] = setLwwRegister(replicas[0], 'replication_mode', 'async-crdt');

  return gossipConvergeAll(replicas);
}
