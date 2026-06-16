import type { Participant } from "../types/session";

const VOTED_PLACEHOLDER = "__voted__";

export interface VoteAnalysis {
  /** vote value → participant ids */
  groups: Map<string, string[]>;
  totalVoted: number;
  /** largest group has ≥75% but not everyone */
  closeOne: boolean;
  /** current user is in a group of 2+ with same vote */
  myMatchGroup: string[] | null;
  dominantVote: string | null;
  dominantShare: number;
}

export function analyzeRevealedVotes(
  participants: Participant[],
  votes: Record<string, string | null>,
  myId: string
): VoteAnalysis {
  const groups = new Map<string, string[]>();

  for (const p of participants) {
    const vote = votes[p.id];
    if (!vote || vote === VOTED_PLACEHOLDER) continue;
    const list = groups.get(vote) ?? [];
    list.push(p.id);
    groups.set(vote, list);
  }

  const totalVoted = [...groups.values()].reduce((sum, g) => sum + g.length, 0);
  let dominantVote: string | null = null;
  let dominantCount = 0;

  for (const [vote, ids] of groups) {
    if (ids.length > dominantCount) {
      dominantCount = ids.length;
      dominantVote = vote;
    }
  }

  const dominantShare = totalVoted > 0 ? dominantCount / totalVoted : 0;
  const fullConsensus = groups.size === 1 && totalVoted > 0;
  const closeOne = !fullConsensus && totalVoted > 0 && dominantShare >= 0.75;

  let myMatchGroup: string[] | null = null;
  const myVote = votes[myId];
  if (myVote && myVote !== VOTED_PLACEHOLDER) {
    const group = groups.get(myVote);
    if (group && group.length >= 2) {
      myMatchGroup = group;
    }
  }

  return {
    groups,
    totalVoted,
    closeOne,
    myMatchGroup,
    dominantVote,
    dominantShare
  };
}

export function getMatchGroupForParticipant(
  participantId: string,
  groups: Map<string, string[]>
): string[] | null {
  for (const ids of groups.values()) {
    if (ids.length >= 2 && ids.includes(participantId)) {
      return ids;
    }
  }
  return null;
}
