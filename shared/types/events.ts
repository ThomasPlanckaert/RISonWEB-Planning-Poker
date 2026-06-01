import type { SessionView } from "./session.js";

export interface CreateRoomPayload {
  username: string;
  name?: string;
  cardSet?: string[];
}

export interface JoinRoomPayload {
  roomCode: string;
  username: string;
  participantId?: string;
}

export interface UpdateStoryPayload {
  name?: string;
  currentStory?: string;
}

export interface ChangeCardSetPayload {
  cardSet: string[];
}

export interface ResetVotesPayload {
  newRound?: boolean;
}

export interface KickParticipantPayload {
  participantId: string;
}

export interface CastVotePayload {
  vote: string;
}

export interface RoomCreatedPayload {
  roomCode: string;
  view: SessionView;
}

export interface RoomJoinedPayload {
  view: SessionView;
}

export interface ParticipantEventPayload {
  participantId: string;
  username: string;
}

export interface VoteCastPayload {
  participantId: string;
}

export interface ConsensusReachedPayload {
  vote: string;
  round: number;
}

export interface ErrorPayload {
  message: string;
}

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload, ack?: (response: AckResponse<RoomCreatedPayload>) => void) => void;
  join_room: (payload: JoinRoomPayload, ack?: (response: AckResponse<RoomJoinedPayload>) => void) => void;
  leave_room: () => void;
  cast_vote: (payload: CastVotePayload) => void;
  reveal_votes: () => void;
  reset_votes: (payload?: ResetVotesPayload) => void;
  change_card_set: (payload: ChangeCardSetPayload) => void;
  update_story: (payload: UpdateStoryPayload) => void;
  kick_participant: (payload: KickParticipantPayload) => void;
}

export interface ServerToClientEvents {
  room_created: (payload: RoomCreatedPayload) => void;
  room_joined: (payload: RoomJoinedPayload) => void;
  participant_joined: (payload: ParticipantEventPayload) => void;
  participant_left: (payload: ParticipantEventPayload) => void;
  vote_cast: (payload: VoteCastPayload) => void;
  votes_revealed: () => void;
  votes_reset: () => void;
  card_set_changed: (payload: { cardSet: string[] }) => void;
  story_updated: (payload: UpdateStoryPayload) => void;
  room_state_updated: (payload: SessionView) => void;
  consensus_reached: (payload: ConsensusReachedPayload) => void;
  error: (payload: ErrorPayload) => void;
  kicked: () => void;
}

export type AckResponse<T> = { ok: true; data: T } | { ok: false; error: string };
