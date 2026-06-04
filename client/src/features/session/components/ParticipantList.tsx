import { motion } from "framer-motion";
import { Card } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { cn } from "../../../shared/lib/utils";
import type { Participant } from "../types/session";

interface ParticipantListProps {
  participants: Participant[];
  votes: Record<string, string | null>;
  revealed: boolean;
  canRemoveParticipants?: boolean;
  onRemoveParticipant?: (participantId: string) => void;
}

export function ParticipantList({
  participants,
  votes,
  revealed,
  canRemoveParticipants,
  onRemoveParticipant
}: ParticipantListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {participants.map((participant) => {
        const vote = votes[participant.id];
        const hasVote = vote != null;
        return (
          <Card key={participant.id} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 text-sm font-bold text-white">
                  {participant.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {participant.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {participant.isModerator
                      ? "Room creator"
                      : participant.isActive
                        ? "Participant"
                        : "Recently disconnected"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <motion.div
                  layout
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-semibold",
                    !hasVote && "bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-slate-300",
                    hasVote && !revealed && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200",
                    hasVote && revealed && "bg-violet-500/25 text-violet-800 dark:text-violet-100"
                  )}
                >
                  {!hasVote
                    ? "Waiting"
                    : revealed
                      ? vote === "__voted__"
                        ? "?"
                        : vote
                      : "Voted"}
                </motion.div>
                {canRemoveParticipants && !participant.isModerator && onRemoveParticipant && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 dark:text-red-300"
                    onClick={() => onRemoveParticipant(participant.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
