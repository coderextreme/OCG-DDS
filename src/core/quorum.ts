export interface QuorumNode {
  id: string;
  label: string;
  reachable: boolean;
  version: number;
  value: string | null;
}

export interface QuorumConfig {
  n: number;
  w: number;
  r: number;
}

export interface QuorumWriteResult {
  success: boolean;
  acks: number;
  requiredW: number;
  writtenVersion: number;
  respondedNodeIds: string[];
  nodes: QuorumNode[];
  message: string;
}

export interface QuorumReadResult {
  success: boolean;
  responses: number;
  requiredR: number;
  returnedValue: string | null;
  returnedVersion: number;
  latestClusterVersion: number;
  isStaleRead: boolean;
  respondedNodeIds: string[];
  repairedNodeIds: string[];
  nodes: QuorumNode[];
  message: string;
}

export function isStrongQuorum(config: QuorumConfig): boolean {
  return config.w + config.r > config.n;
}

export function createSeedQuorumState(): {
  config: QuorumConfig;
  nodes: QuorumNode[];
  latestWrittenVersion: number;
} {
  const nodes: QuorumNode[] = [
    { id: 'Q1', label: 'Replica 1', reachable: true, version: 1, value: 'v1-init' },
    { id: 'Q2', label: 'Replica 2', reachable: true, version: 1, value: 'v1-init' },
    { id: 'Q3', label: 'Replica 3', reachable: true, version: 1, value: 'v1-init' },
    { id: 'Q4', label: 'Replica 4', reachable: true, version: 1, value: 'v1-init' },
    { id: 'Q5', label: 'Replica 5', reachable: true, version: 1, value: 'v1-init' },
  ];

  return {
    config: { n: 5, w: 3, r: 3 },
    nodes,
    latestWrittenVersion: 1,
  };
}

/**
 * Executes a quorum write across up to W reachable nodes (ordered deterministically or starting from coordinator offset).
 */
export function executeQuorumWrite(
  nodes: QuorumNode[],
  config: QuorumConfig,
  newValue: string,
  currentGlobalVersion: number,
  coordinatorStartIndex = 0
): QuorumWriteResult {
  const trimmed = newValue.trim();
  const activeNodes = nodes.slice(0, config.n);
  const reachable = [];

  for (let i = 0; i < activeNodes.length; i++) {
    const idx = (coordinatorStartIndex + i) % activeNodes.length;
    if (activeNodes[idx].reachable) {
      reachable.push(activeNodes[idx]);
    }
  }

  if (reachable.length < config.w) {
    return {
      success: false,
      acks: reachable.length,
      requiredW: config.w,
      writtenVersion: currentGlobalVersion,
      respondedNodeIds: [],
      nodes,
      message: `Write rejected: only ${reachable.length} reachable replicas, but W=${config.w} required.`,
    };
  }

  const nextVersion = currentGlobalVersion + 1;
  const targets = reachable.slice(0, config.w);
  const targetIds = new Set(targets.map((n) => n.id));

  const updatedNodes = nodes.map((node) => {
    if (targetIds.has(node.id)) {
      return {
        ...node,
        version: nextVersion,
        value: trimmed,
      };
    }
    return node;
  });

  return {
    success: true,
    acks: targets.length,
    requiredW: config.w,
    writtenVersion: nextVersion,
    respondedNodeIds: targets.map((n) => n.id),
    nodes: updatedNodes,
    message: `Write committed (v${nextVersion}: "${trimmed}") to ${targets.length}/${config.n} replicas [${targets.map((n) => n.id).join(', ')}].`,
  };
}

/**
 * Executes a quorum read across R reachable nodes, checks for stale reads against global latest version,
 * and optionally applies read-repair to stale responders.
 */
export function executeQuorumRead(
  nodes: QuorumNode[],
  config: QuorumConfig,
  latestGlobalVersion: number,
  enableReadRepair: boolean,
  readStartOffset = 0
): QuorumReadResult {
  const activeNodes = nodes.slice(0, config.n);
  const reachable: QuorumNode[] = [];

  for (let i = 0; i < activeNodes.length; i++) {
    const idx = (readStartOffset + i) % activeNodes.length;
    if (activeNodes[idx].reachable) {
      reachable.push(activeNodes[idx]);
    }
  }

  if (reachable.length < config.r) {
    return {
      success: false,
      responses: reachable.length,
      requiredR: config.r,
      returnedValue: null,
      returnedVersion: 0,
      latestClusterVersion: latestGlobalVersion,
      isStaleRead: false,
      respondedNodeIds: [],
      repairedNodeIds: [],
      nodes,
      message: `Read failed: only ${reachable.length} reachable replicas, but R=${config.r} required.`,
    };
  }

  const responders = reachable.slice(0, config.r);
  const winningNode = responders.reduce((best, curr) =>
    curr.version > best.version ? curr : best
  );

  const isStaleRead = winningNode.version < latestGlobalVersion;
  const repairedNodeIds: string[] = [];
  let nextNodes = nodes;

  if (enableReadRepair) {
    const responderIdSet = new Set(responders.map((r) => r.id));
    nextNodes = nodes.map((n) => {
      if (responderIdSet.has(n.id) && n.version < winningNode.version) {
        repairedNodeIds.push(n.id);
        return {
          ...n,
          version: winningNode.version,
          value: winningNode.value,
        };
      }
      return n;
    });
  }

  return {
    success: true,
    responses: responders.length,
    requiredR: config.r,
    returnedValue: winningNode.value,
    returnedVersion: winningNode.version,
    latestClusterVersion: latestGlobalVersion,
    isStaleRead,
    respondedNodeIds: responders.map((r) => r.id),
    repairedNodeIds,
    nodes: nextNodes,
    message: isStaleRead
      ? `Stale read detected! Returned v${winningNode.version} ("${winningNode.value}") while cluster latest is v${latestGlobalVersion} because W+R <= N.`
      : `Read succeeded with fresh v${winningNode.version} ("${winningNode.value}") from [${responders.map((r) => r.id).join(', ')}].`,
  };
}
