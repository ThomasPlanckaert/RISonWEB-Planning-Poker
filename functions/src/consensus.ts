export const ONLINE_THRESHOLD_MS = 45_000;

export interface ConsensusInput {
  revealed: boolean;
  participants: Array<{ uid: string; lastSeenMs: number | null }>;
  votes: Array<{ participantId: string; value: string }>;
}

export interface ConsensusResult {
  reached: boolean;
  vote: string | null;
}

export function evaluateConsensus(input: ConsensusInput): ConsensusResult {
  if (!input.revealed) {
    return { reached: false, vote: null };
  }

  const now = Date.now();
  const activeUids = new Set(
    input.participants
      .filter((p) => p.lastSeenMs != null && now - p.lastSeenMs <= ONLINE_THRESHOLD_MS)
      .map((p) => p.uid)
  );

  if (activeUids.size === 0) {
    return { reached: false, vote: null };
  }

  const values: string[] = [];
  for (const uid of activeUids) {
    const vote = input.votes.find((v) => v.participantId === uid);
    if (!vote?.value) {
      return { reached: false, vote: null };
    }
    values.push(vote.value);
  }

  if (new Set(values).size !== 1) {
    return { reached: false, vote: null };
  }

  return { reached: true, vote: values[0] };
}
