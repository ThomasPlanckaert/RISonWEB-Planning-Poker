import type { Participant } from "../types/session";

const VOTED_PLACEHOLDER = "__voted__";

/** Average of numeric revealed votes, rounded up. Returns null if no numeric votes. */
export function computeRoundedUpAverage(
  participants: Participant[],
  votes: Record<string, string | null>
): number | null {
  const values: number[] = [];

  for (const p of participants) {
    const raw = votes[p.id];
    if (!raw || raw === VOTED_PLACEHOLDER) continue;
    const n = Number.parseFloat(raw);
    if (!Number.isNaN(n)) values.push(n);
  }

  if (values.length === 0) return null;

  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.ceil(sum / values.length);
}
