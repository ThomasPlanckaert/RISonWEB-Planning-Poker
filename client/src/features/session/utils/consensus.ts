import type { Participant } from "../types/session";

const VOTED_PLACEHOLDER = "__voted__";

export function detectConsensus(
  revealed: boolean,
  participants: Participant[],
  votes: Record<string, string | null>
): boolean {
  if (!revealed) return false;

  const active = participants.filter((p) => p.isActive !== false);
  if (active.length === 0) return false;

  const values = active
    .map((p) => votes[p.id])
    .filter((v): v is string => !!v && v !== VOTED_PLACEHOLDER);

  return values.length === active.length && new Set(values).size === 1;
}

export function getConsensusVote(
  participants: Participant[],
  votes: Record<string, string | null>
): string | null {
  const active = participants.filter((p) => p.isActive !== false);
  const values = active
    .map((p) => votes[p.id])
    .filter((v): v is string => !!v && v !== VOTED_PLACEHOLDER);
  if (values.length === 0 || new Set(values).size !== 1) return null;
  return values[0];
}
