export const VOTE_GROUP_STYLES = [
  {
    ring: "ring-violet-400/70 dark:ring-violet-300/55",
    badge: "bg-violet-500/25 text-violet-800 dark:text-violet-100",
    label: "text-violet-700 dark:text-violet-200"
  },
  {
    ring: "ring-cyan-400/70 dark:ring-cyan-300/55",
    badge: "bg-cyan-500/25 text-cyan-800 dark:text-cyan-100",
    label: "text-cyan-700 dark:text-cyan-200"
  },
  {
    ring: "ring-amber-400/70 dark:ring-amber-300/55",
    badge: "bg-amber-500/25 text-amber-800 dark:text-amber-100",
    label: "text-amber-700 dark:text-amber-200"
  },
  {
    ring: "ring-emerald-400/70 dark:ring-emerald-300/55",
    badge: "bg-emerald-500/25 text-emerald-800 dark:text-emerald-100",
    label: "text-emerald-700 dark:text-emerald-200"
  },
  {
    ring: "ring-rose-400/70 dark:ring-rose-300/55",
    badge: "bg-rose-500/25 text-rose-800 dark:text-rose-100",
    label: "text-rose-700 dark:text-rose-200"
  },
  {
    ring: "ring-indigo-400/70 dark:ring-indigo-300/55",
    badge: "bg-indigo-500/25 text-indigo-800 dark:text-indigo-100",
    label: "text-indigo-700 dark:text-indigo-200"
  }
] as const;

export function buildVoteGroupMap(
  groups: Map<string, string[]>
): Record<string, number> {
  const map: Record<string, number> = {};
  let colorIndex = 0;

  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      map[id] = colorIndex % VOTE_GROUP_STYLES.length;
    }
    colorIndex++;
  }

  return map;
}
