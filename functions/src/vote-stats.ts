export interface RevealStats {
  closeOne: boolean;
  matchedUids: string[];
  pairKeys: string[];
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

export function analyzeRevealStats(
  votes: Array<{ participantId: string; value: string }>
): RevealStats {
  const groups = new Map<string, string[]>();

  for (const vote of votes) {
    if (!vote.value) continue;
    const list = groups.get(vote.value) ?? [];
    list.push(vote.participantId);
    groups.set(vote.value, list);
  }

  const totalVoted = [...groups.values()].reduce((sum, group) => sum + group.length, 0);
  if (totalVoted === 0) {
    return { closeOne: false, matchedUids: [], pairKeys: [] };
  }

  let dominantCount = 0;
  for (const ids of groups.values()) {
    if (ids.length > dominantCount) dominantCount = ids.length;
  }

  const fullConsensus = groups.size === 1;
  const dominantShare = dominantCount / totalVoted;
  const closeOne = !fullConsensus && dominantShare >= 0.75;

  const matchedUids: string[] = [];
  const pairKeys: string[] = [];

  for (const ids of groups.values()) {
    if (ids.length < 2) continue;

    matchedUids.push(...ids);

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        pairKeys.push(pairKey(ids[i], ids[j]));
      }
    }
  }

  return { closeOne, matchedUids, pairKeys };
}
