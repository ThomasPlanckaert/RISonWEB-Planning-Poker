import type { Session, SessionView } from "@planning-poker/shared";
import { DEFAULT_CARD_SET, VOTE_MASK } from "@planning-poker/shared";
import { generateRoomCode, normalizeRoomCode } from "./rooms.js";

interface SocketBinding {
  socketId: string;
  participantId: string;
}

export class SessionManager {
  private sessions = new Map<string, Session>();
  private socketBindings = new Map<string, SocketBinding>();

  getSession(roomCode: string): Session | undefined {
    return this.sessions.get(normalizeRoomCode(roomCode));
  }

  bindSocket(socketId: string, roomCode: string, participantId: string): void {
    this.socketBindings.set(socketId, {
      socketId,
      participantId
    });
    const session = this.getSession(roomCode);
    if (!session) return;
    const participant = session.participants.find((p) => p.id === participantId);
    if (participant) participant.connected = true;
  }

  unbindSocket(socketId: string): { roomCode: string; participantId: string } | null {
    const binding = this.socketBindings.get(socketId);
    if (!binding) return null;
    this.socketBindings.delete(socketId);

    for (const [roomCode, session] of this.sessions) {
      const participant = session.participants.find((p) => p.id === binding.participantId);
      if (participant) {
        participant.connected = false;
        return { roomCode, participantId: binding.participantId };
      }
    }
    return null;
  }

  getBinding(socketId: string): (SocketBinding & { roomCode: string }) | null {
    const binding = this.socketBindings.get(socketId);
    if (!binding) return null;

    for (const [roomCode, session] of this.sessions) {
      if (session.participants.some((p) => p.id === binding.participantId)) {
        return { ...binding, roomCode };
      }
    }
    return null;
  }

  createRoom(
    username: string,
    options?: { name?: string; cardSet?: string[] }
  ): { roomCode: string; session: Session; participantId: string } {
    let roomCode = generateRoomCode();
    while (this.sessions.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const participantId = crypto.randomUUID();
    const session: Session = {
      id: roomCode,
      name: options?.name ?? "Sprint Planning",
      moderatorId: participantId,
      cardSet: options?.cardSet ?? [...DEFAULT_CARD_SET],
      currentStory: "As a user, I can reset my password using email",
      revealed: false,
      participants: [
        {
          id: participantId,
          username,
          connected: true,
          isModerator: true
        }
      ],
      votes: {},
      round: 1
    };

    this.sessions.set(roomCode, session);
    return { roomCode, session, participantId };
  }

  joinRoom(
    roomCodeInput: string,
    username: string,
    participantId?: string
  ): { session: Session; participantId: string; reconnected: boolean } {
    const roomCode = normalizeRoomCode(roomCodeInput);
    const session = this.sessions.get(roomCode);
    if (!session) throw new Error("Room not found");

    if (participantId) {
      const existing = session.participants.find((p) => p.id === participantId);
      if (existing) {
        existing.connected = true;
        existing.username = username;
        return { session, participantId, reconnected: true };
      }
    }

    const newParticipantId = crypto.randomUUID();
    session.participants.push({
      id: newParticipantId,
      username,
      connected: true,
      isModerator: false
    });

    return { session, participantId: newParticipantId, reconnected: false };
  }

  leaveRoom(socketId: string): {
    roomCode: string;
    participantId: string;
    username: string;
    session: Session | null;
  } | null {
    const binding = this.getBinding(socketId);
    if (!binding) return null;

    const session = this.sessions.get(binding.roomCode);
    if (!session) return null;

    const participant = session.participants.find((p) => p.id === binding.participantId);
    const username = participant?.username ?? "User";

    session.participants = session.participants.filter((p) => p.id !== binding.participantId);
    delete session.votes[binding.participantId];
    this.socketBindings.delete(socketId);

    if (session.participants.length === 0) {
      this.sessions.delete(binding.roomCode);
      return { roomCode: binding.roomCode, participantId: binding.participantId, username, session: null };
    }

    return { roomCode: binding.roomCode, participantId: binding.participantId, username, session };
  }

  requireModerator(socketId: string): { roomCode: string; session: Session; participantId: string } {
    const ctx = this.requireParticipant(socketId);
    if (ctx.session.moderatorId !== ctx.participantId) {
      throw new Error("Only the moderator can perform this action");
    }
    return ctx;
  }

  requireParticipant(socketId: string): {
    roomCode: string;
    session: Session;
    participantId: string;
  } {
    const binding = this.getBinding(socketId);
    if (!binding) throw new Error("Not in a room");

    const session = this.sessions.get(binding.roomCode);
    if (!session) throw new Error("Room not found");

    const participant = session.participants.find((p) => p.id === binding.participantId);
    if (!participant) throw new Error("Participant not found");

    return { roomCode: binding.roomCode, session, participantId: binding.participantId };
  }

  castVote(socketId: string, vote: string): Session {
    const { session, participantId } = this.requireParticipant(socketId);
    if (session.revealed) throw new Error("Votes are locked after reveal");
    if (!session.cardSet.includes(vote)) throw new Error("Invalid card value");

    session.votes[participantId] = vote;
    return session;
  }

  revealVotes(socketId: string): { session: Session; consensus: boolean; consensusVote?: string } {
    const { session } = this.requireModerator(socketId);
    session.revealed = true;

    const activeParticipants = session.participants.filter((p) => p.connected);
    const voteValues = activeParticipants
      .map((p) => session.votes[p.id])
      .filter((v): v is string => !!v);

    const everyoneVoted =
      activeParticipants.length > 0 && voteValues.length === activeParticipants.length;
    const consensus =
      everyoneVoted && voteValues.length > 0 && new Set(voteValues).size === 1;

    return {
      session,
      consensus,
      consensusVote: consensus ? voteValues[0] : undefined
    };
  }

  resetVotes(socketId: string, newRound = false): Session {
    const { session } = this.requireModerator(socketId);
    session.revealed = false;
    session.votes = {};
    if (newRound) session.round += 1;
    return session;
  }

  changeCardSet(socketId: string, cardSet: string[]): Session {
    const { session } = this.requireModerator(socketId);
    if (cardSet.length === 0) throw new Error("Card set cannot be empty");

    session.cardSet = [...cardSet];
    session.revealed = false;
    session.votes = {};
    return session;
  }

  updateStory(
    socketId: string,
    payload: { name?: string; currentStory?: string }
  ): Session {
    const { session } = this.requireModerator(socketId);
    if (payload.name !== undefined) session.name = payload.name;
    if (payload.currentStory !== undefined) session.currentStory = payload.currentStory;
    return session;
  }

  kickParticipant(socketId: string, targetId: string): {
    session: Session;
    kickedParticipantId: string;
    kickedSocketId?: string;
  } {
    const { session, participantId } = this.requireModerator(socketId);
    if (targetId === participantId) throw new Error("Cannot kick yourself");
    if (targetId === session.moderatorId) throw new Error("Cannot kick the moderator");

    const target = session.participants.find((p) => p.id === targetId);
    if (!target) throw new Error("Participant not found");

    session.participants = session.participants.filter((p) => p.id !== targetId);
    delete session.votes[targetId];

    let kickedSocketId: string | undefined;
    for (const [sid, binding] of this.socketBindings) {
      if (binding.participantId === targetId) {
        kickedSocketId = sid;
        this.socketBindings.delete(sid);
        break;
      }
    }

    return { session, kickedParticipantId: targetId, kickedSocketId };
  }

  toSessionView(session: Session, viewerParticipantId: string): SessionView {
    const votes: Record<string, string | null> = {};

    for (const participant of session.participants) {
      const vote = session.votes[participant.id];
      if (!vote) {
        votes[participant.id] = null;
      } else if (session.revealed || participant.id === viewerParticipantId) {
        votes[participant.id] = vote;
      } else {
        votes[participant.id] = VOTE_MASK;
      }
    }

    return {
      session: { ...session },
      votes,
      participantId: viewerParticipantId
    };
  }
}
