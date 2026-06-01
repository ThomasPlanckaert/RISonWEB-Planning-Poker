import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { SessionView } from "@planning-poker/shared";
import { mapSessionView } from "../features/session/utils/session-mapper";
import type { Participant, PokerSession } from "../features/session/types/session";
import {
  findDeckForCardSet,
  usePokerStore
} from "../features/session/store/usePokerStore";
import { clearIdentity, loadIdentity, saveIdentity } from "../services/storage";
import { disconnectSocket, getSocket } from "../services/socket";

interface UseSocketSessionResult {
  session: PokerSession | null;
  me: Participant | null;
  participantId: string | null;
  connected: boolean;
  connecting: boolean;
  createRoom: (username: string) => Promise<string | null>;
  joinRoom: (username: string, roomCode: string) => Promise<boolean>;
  castVote: (vote: string) => void;
  revealVotes: () => void;
  clearVotes: () => void;
  nextRound: () => void;
  setStory: (story: string) => void;
  setTitle: (title: string) => void;
  setDeck: (deckId: string) => void;
  removeParticipant: (userId: string) => void;
  leaveRoom: () => void;
}

export function useSocketSession(
  roomCode?: string,
  options?: { autoReconnect?: boolean }
): UseSocketSessionResult {
  const navigate = useNavigate();
  const decks = usePokerStore((s) => s.decks);
  const setCelebrationRound = usePokerStore((s) => s.setCelebrationRound);
  const setSelectedDeckId = usePokerStore((s) => s.setSelectedDeckId);

  const [view, setView] = useState<SessionView | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const reconnectAttempted = useRef(false);

  const applyView = useCallback(
    (next: SessionView) => {
      setView(next);
      const match = findDeckForCardSet(decks, next.session.cardSet);
      if (match) setSelectedDeckId(match.id);

      saveIdentity({
        username: next.session.participants.find((p) => p.id === next.participantId)?.username ?? "",
        roomCode: next.session.id,
        participantId: next.participantId
      });
    },
    [decks, setSelectedDeckId]
  );

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      const stored = loadIdentity();
      if (
        options?.autoReconnect &&
        roomCode &&
        stored.roomCode?.toUpperCase() === roomCode.toUpperCase() &&
        stored.username &&
        stored.participantId
      ) {
        socket.emit(
          "join_room",
          {
            roomCode: roomCode.toUpperCase(),
            username: stored.username,
            participantId: stored.participantId
          },
          (response) => {
            if (response?.ok) applyView(response.data.view);
          }
        );
      }
    };
    const onDisconnect = () => setConnected(false);
    const onRoomState = (payload: SessionView) => applyView(payload);
    const onConsensus = (payload: { round: number }) => {
      setCelebrationRound(payload.round);
    };
    const onVotesReset = () => setCelebrationRound(null);
    const onError = (payload: { message: string }) => toast.error(payload.message);
    const onKicked = () => {
      toast.error("You were removed from the session");
      clearIdentity();
      disconnectSocket();
      navigate("/");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room_state_updated", onRoomState);
    socket.on("room_created", (p) => applyView(p.view));
    socket.on("room_joined", (p) => applyView(p.view));
    socket.on("consensus_reached", onConsensus);
    socket.on("votes_reset", onVotesReset);
    socket.on("error", onError);
    socket.on("kicked", onKicked);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room_state_updated", onRoomState);
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("consensus_reached", onConsensus);
      socket.off("votes_reset", onVotesReset);
      socket.off("error", onError);
      socket.off("kicked", onKicked);
    };
  }, [applyView, navigate, options?.autoReconnect, roomCode, setCelebrationRound, view]);

  useEffect(() => {
    if (!roomCode || !options?.autoReconnect || reconnectAttempted.current || view) return;

    const normalized = roomCode.toUpperCase();
    const stored = loadIdentity();
    if (stored.roomCode?.toUpperCase() !== normalized || !stored.username) return;

    reconnectAttempted.current = true;
    setConnecting(true);

    const socket = getSocket();
    socket.emit(
      "join_room",
      {
        roomCode: normalized,
        username: stored.username,
        participantId: stored.participantId
      },
      (response) => {
        setConnecting(false);
        if (response?.ok) {
          applyView(response.data.view);
        } else if (response && !response.ok) {
          toast.error(response.error);
          navigate("/");
        }
      }
    );
  }, [roomCode, options?.autoReconnect, view, applyView, navigate]);

  const selectedDeckId = usePokerStore((s) => s.selectedDeckId);
  const mapped = view
    ? mapSessionView(view, findDeckForCardSet(decks, view.session.cardSet)?.id ?? selectedDeckId)
    : null;

  const createRoom = useCallback(
    (username: string) =>
      new Promise<string | null>((resolve) => {
        setConnecting(true);
        const socket = getSocket();
        const defaultDeck = decks[0];
        socket.emit(
          "create_room",
          { username, cardSet: defaultDeck.values, name: "Sprint Planning" },
          (response) => {
            setConnecting(false);
            if (response?.ok) {
              applyView(response.data.view);
              resolve(response.data.roomCode);
            } else {
              toast.error(response && !response.ok ? response.error : "Failed to create room");
              resolve(null);
            }
          }
        );
      }),
    [applyView, decks]
  );

  const joinRoom = useCallback(
    (username: string, code: string) =>
      new Promise<boolean>((resolve) => {
        setConnecting(true);
        const socket = getSocket();
        const stored = loadIdentity();
        socket.emit(
          "join_room",
          {
            roomCode: code.toUpperCase(),
            username,
            participantId:
              stored.roomCode?.toUpperCase() === code.toUpperCase()
                ? stored.participantId
                : undefined
          },
          (response) => {
            setConnecting(false);
            if (response?.ok) {
              applyView(response.data.view);
              resolve(true);
            } else {
              toast.error(response && !response.ok ? response.error : "Failed to join room");
              resolve(false);
            }
          }
        );
      }),
    [applyView]
  );

  return {
    session: mapped?.session ?? null,
    me: mapped?.me ?? null,
    participantId: mapped?.participantId ?? null,
    connected,
    connecting,
    createRoom,
    joinRoom,
    castVote: (vote) => getSocket().emit("cast_vote", { vote }),
    revealVotes: () => getSocket().emit("reveal_votes"),
    clearVotes: () => getSocket().emit("reset_votes"),
    nextRound: () => getSocket().emit("reset_votes", { newRound: true }),
    setStory: (currentStory) => getSocket().emit("update_story", { currentStory }),
    setTitle: (name) => getSocket().emit("update_story", { name }),
    setDeck: (deckId) => {
      const deck = decks.find((d) => d.id === deckId);
      if (deck) getSocket().emit("change_card_set", { cardSet: deck.values });
    },
    removeParticipant: (participantId) =>
      getSocket().emit("kick_participant", { participantId }),
    leaveRoom: () => {
      getSocket().emit("leave_room");
      clearIdentity();
      disconnectSocket();
    }
  };
}
