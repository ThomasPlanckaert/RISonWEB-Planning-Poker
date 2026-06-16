import type { Participant } from "../types/session";

export interface SessionStats {
  consensuses: number;
  closeOnes: number;
  matchCounts: Record<string, number>;
  pairCounts: Record<string, number>;
}

export interface SyncLeaders {
  mostInSyncGroups: Participant[][];
  leastInSync: Participant[];
}

function participantMap(participants: Participant[]): Map<string, Participant> {
  return new Map(participants.map((p) => [p.id, p]));
}

function connectedComponents(adjacency: Map<string, Set<string>>): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const start of adjacency.keys()) {
    if (visited.has(start)) continue;

    const component: string[] = [];
    const stack = [start];

    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);

      for (const neighbor of adjacency.get(id) ?? []) {
        if (!visited.has(neighbor)) stack.push(neighbor);
      }
    }

    if (component.length > 0) components.push(component);
  }

  return components;
}

function groupsFromPairCounts(
  participants: Participant[],
  pairCounts: Record<string, number>
): Participant[][] {
  const pairs = Object.entries(pairCounts);
  if (pairs.length === 0) return [];

  const maxPairCount = Math.max(...pairs.map(([, count]) => count));
  if (maxPairCount === 0) return [];

  const byId = participantMap(participants);
  const adjacency = new Map<string, Set<string>>();

  for (const [key, count] of pairs) {
    if (count !== maxPairCount) continue;
    const [a, b] = key.split("|");
    if (!byId.has(a) || !byId.has(b)) continue;

    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
  }

  return connectedComponents(adjacency)
    .map((uids) =>
      uids.map((id) => byId.get(id)).filter((p): p is Participant => p != null)
    )
    .filter((group) => group.length > 0)
    .sort((a, b) => b.length - a.length);
}

function groupsFromMatchCounts(
  participants: Participant[],
  matchCounts: Record<string, number>
): Participant[][] {
  const max = Math.max(...participants.map((p) => matchCounts[p.id] ?? 0));
  if (max === 0) return [];

  const leaders = participants.filter((p) => (matchCounts[p.id] ?? 0) === max);
  return leaders.length > 0 ? [leaders] : [];
}

export function computeSyncLeaders(
  participants: Participant[],
  matchCounts: Record<string, number>,
  pairCounts: Record<string, number>
): SyncLeaders {
  if (participants.length === 0) {
    return { mostInSyncGroups: [], leastInSync: [] };
  }

  const pairGroups = groupsFromPairCounts(participants, pairCounts);
  const mostInSyncGroups =
    pairGroups.length > 0 ? pairGroups : groupsFromMatchCounts(participants, matchCounts);

  const mostInSyncIds = new Set(mostInSyncGroups.flat().map((p) => p.id));
  const scored = participants.map((p) => ({
    participant: p,
    count: matchCounts[p.id] ?? 0
  }));

  const min = Math.min(...scored.map((s) => s.count));
  const max = Math.max(...scored.map((s) => s.count));

  let leastInSync: Participant[] = [];
  if (min < max) {
    leastInSync = scored
      .filter((s) => s.count === min && !mostInSyncIds.has(s.participant.id))
      .map((s) => s.participant);
  }

  if (leastInSync.length === 0 && min < max) {
    leastInSync = scored.filter((s) => s.count === min).map((s) => s.participant);
  }

  return { mostInSyncGroups, leastInSync };
}
