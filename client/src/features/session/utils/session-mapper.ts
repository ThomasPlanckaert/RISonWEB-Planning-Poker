import type { SessionView } from "@planning-poker/shared";
import { VOTE_MASK } from "@planning-poker/shared";
import type { PokerSession, Participant } from "../types/session";
import { initials } from "./session-utils";

export function mapSessionView(view: SessionView, deckId: string): {
  session: PokerSession;
  participantId: string;
  me: Participant;
} {
  const { session, votes, participantId } = view;
  const meServer = session.participants.find((p) => p.id === participantId)!;

  const participants: Participant[] = session.participants.map((p) => ({
    id: p.id,
    name: p.username,
    avatar: initials(p.username),
    isModerator: p.isModerator,
    isActive: p.connected
  }));

  const mappedVotes: Record<string, string | null> = {};
  for (const p of session.participants) {
    const vote = votes[p.id];
    if (vote === VOTE_MASK) {
      mappedVotes[p.id] = "__voted__";
    } else {
      mappedVotes[p.id] = vote;
    }
  }

  const pokerSession: PokerSession = {
    id: session.id,
    title: session.name ?? "Sprint Planning",
    story: session.currentStory ?? "",
    deckId,
    cardSet: session.cardSet,
    participants,
    votes: mappedVotes,
    revealed: session.revealed,
    round: session.round
  };

  const me: Participant = {
    id: meServer.id,
    name: meServer.username,
    avatar: initials(meServer.username),
    isModerator: meServer.isModerator,
    isActive: meServer.connected
  };

  return { session: pokerSession, participantId, me };
}
