export const PRESENCE_INTERVAL_MS = 15_000;
export const ONLINE_THRESHOLD_MS = 45_000;

export function isParticipantOnline(lastSeenMs: number | null, now = Date.now()): boolean {
  if (lastSeenMs == null) return false;
  return now - lastSeenMs <= ONLINE_THRESHOLD_MS;
}
