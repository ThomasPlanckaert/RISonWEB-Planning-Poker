import { motion } from "framer-motion";
import { Card } from "../../../shared/components/ui/card";
import { cn } from "../../../shared/lib/utils";
import type { Participant } from "../types/session";

interface ParticipantListProps {
  participants: Participant[];
  votes: Record<string, string | null>;
  revealed: boolean;
}

export function ParticipantList({ participants, votes, revealed }: ParticipantListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {participants.map((participant) => {
        const hasVote = !!votes[participant.id];
        return (
          <Card key={participant.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-content-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 text-sm font-bold text-white">
                  {participant.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{participant.name}</p>
                  <p className="text-xs text-slate-300">{participant.isModerator ? "Moderator" : "Participant"}</p>
                </div>
              </div>

              <motion.div
                layout
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-semibold",
                  !hasVote && "bg-white/10 text-slate-300",
                  hasVote && !revealed && "bg-emerald-500/20 text-emerald-200",
                  hasVote && revealed && "bg-violet-500/25 text-violet-100"
                )}
              >
                {!hasVote ? "Waiting" : revealed ? votes[participant.id] : "Voted"}
              </motion.div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
