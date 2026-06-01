import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import type {
  AckResponse,
  CastVotePayload,
  ChangeCardSetPayload,
  ClientToServerEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  KickParticipantPayload,
  ResetVotesPayload,
  RoomCreatedPayload,
  RoomJoinedPayload,
  ServerToClientEvents,
  SessionView,
  UpdateStoryPayload
} from "@planning-poker/shared";
import { SessionManager } from "./sessionManager.js";
import { normalizeRoomCode } from "./rooms.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
const httpServer = createServer(app);
const sessionManager = new SessionManager();

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: CLIENT_ORIGIN.split(",").map((o) => o.trim()) }));
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get(/^(?!\/socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

function broadcastState(roomCode: string, session: SessionView["session"]): void {
  for (const [socketId, binding] of getRoomSockets(roomCode)) {
    const view = sessionManager.toSessionView(session, binding.participantId);
    io.to(socketId).emit("room_state_updated", view);
  }
}

function getRoomSockets(roomCode: string): Map<string, { participantId: string }> {
  const result = new Map<string, { participantId: string }>();
  for (const socket of io.sockets.sockets.values()) {
    const binding = sessionManager.getBinding(socket.id);
    if (binding?.roomCode === roomCode) {
      result.set(socket.id, { participantId: binding.participantId });
    }
  }
  return result;
}

function emitToRoom<E extends keyof ServerToClientEvents>(
  roomCode: string,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  const room = io.to(roomCode);
  type EmitFn = (ev: E, ...params: Parameters<ServerToClientEvents[E]>) => void;
  (room.emit as EmitFn)(event, ...args);
}

function handleError(socket: import("socket.io").Socket, error: unknown): void {
  const message = error instanceof Error ? error.message : "Something went wrong";
  socket.emit("error", { message });
}

io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  socket.on("create_room", (payload: CreateRoomPayload, ack?: (response: AckResponse<RoomCreatedPayload>) => void) => {
    try {
      const { roomCode, session, participantId } = sessionManager.createRoom(payload.username, {
        name: payload.name,
        cardSet: payload.cardSet
      });
      sessionManager.bindSocket(socket.id, roomCode, participantId);
      void socket.join(roomCode);

      const view = sessionManager.toSessionView(session, participantId);
      socket.emit("room_created", { roomCode, view });
      ack?.({ ok: true, data: { roomCode, view } });
    } catch (error) {
      handleError(socket, error);
      ack?.({ ok: false, error: error instanceof Error ? error.message : "Failed" });
    }
  });

  socket.on("join_room", (payload: JoinRoomPayload, ack?: (response: AckResponse<RoomJoinedPayload>) => void) => {
    try {
      const { session, participantId, reconnected } = sessionManager.joinRoom(
        payload.roomCode,
        payload.username,
        payload.participantId
      );
      sessionManager.bindSocket(socket.id, normalizeRoomCode(payload.roomCode), participantId);
      void socket.join(session.id);

      const view = sessionManager.toSessionView(session, participantId);
      socket.emit("room_joined", { view });
      if (!reconnected) {
        emitToRoom(session.id, "participant_joined", {
          participantId,
          username: payload.username
        });
      }
      broadcastState(session.id, session);
      ack?.({ ok: true, data: { view } });
    } catch (error) {
      handleError(socket, error);
      ack?.({ ok: false, error: error instanceof Error ? error.message : "Failed" });
    }
  });

  socket.on("leave_room", () => {
    const left = sessionManager.leaveRoom(socket.id);
    if (!left) return;
    void socket.leave(left.roomCode);
    emitToRoom(left.roomCode, "participant_left", {
      participantId: left.participantId,
      username: left.username
    });
    if (left.session) {
      broadcastState(left.roomCode, left.session);
    }
  });

  socket.on("cast_vote", (payload: CastVotePayload) => {
    try {
      const session = sessionManager.castVote(socket.id, payload.vote);
      const { participantId } = sessionManager.requireParticipant(socket.id);
      emitToRoom(session.id, "vote_cast", { participantId });
      broadcastState(session.id, session);
    } catch (error) {
      handleError(socket, error);
    }
  });

  socket.on("reveal_votes", () => {
    try {
      const { session, consensus, consensusVote } = sessionManager.revealVotes(socket.id);
      emitToRoom(session.id, "votes_revealed");
      broadcastState(session.id, session);
      if (consensus && consensusVote) {
        emitToRoom(session.id, "consensus_reached", {
          vote: consensusVote,
          round: session.round
        });
      }
    } catch (error) {
      handleError(socket, error);
    }
  });

  socket.on("reset_votes", (payload?: ResetVotesPayload) => {
    try {
      const session = sessionManager.resetVotes(socket.id, payload?.newRound ?? false);
      emitToRoom(session.id, "votes_reset");
      broadcastState(session.id, session);
    } catch (error) {
      handleError(socket, error);
    }
  });

  socket.on("change_card_set", (payload: ChangeCardSetPayload) => {
    try {
      const session = sessionManager.changeCardSet(socket.id, payload.cardSet);
      emitToRoom(session.id, "card_set_changed", { cardSet: session.cardSet });
      broadcastState(session.id, session);
    } catch (error) {
      handleError(socket, error);
    }
  });

  socket.on("update_story", (payload: UpdateStoryPayload) => {
    try {
      const session = sessionManager.updateStory(socket.id, payload);
      emitToRoom(session.id, "story_updated", payload);
      broadcastState(session.id, session);
    } catch (error) {
      handleError(socket, error);
    }
  });

  socket.on("kick_participant", (payload: KickParticipantPayload) => {
    try {
      const { session, kickedParticipantId, kickedSocketId } = sessionManager.kickParticipant(
        socket.id,
        payload.participantId
      );
      if (kickedSocketId) {
        const kickedSocket = io.sockets.sockets.get(kickedSocketId);
        kickedSocket?.emit("kicked");
        kickedSocket?.leave(session.id);
      }
      emitToRoom(session.id, "participant_left", {
        participantId: kickedParticipantId,
        username: "Removed user"
      });
      broadcastState(session.id, session);
    } catch (error) {
      handleError(socket, error);
    }
  });

  socket.on("disconnect", () => {
    const binding = sessionManager.unbindSocket(socket.id);
    if (!binding) return;

    const session = sessionManager.getSession(binding.roomCode);
    if (!session) return;

    broadcastState(binding.roomCode, session);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Planning Poker server listening on port ${PORT}`);
});
