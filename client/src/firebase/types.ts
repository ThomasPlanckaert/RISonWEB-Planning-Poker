import type { Timestamp } from "firebase/firestore";

export interface FirestoreSession {
  id: string;
  roomCode: string;
  title: string;
  moderatorUid: string;
  currentStory: string;
  cardSet: string[];
  revealed: boolean;
  round: number;
  createdAt: Timestamp;
  consensusReached: boolean;
  consensusRound: number | null;
  consensusVote: string | null;
}

export interface FirestoreParticipant {
  uid: string;
  username: string;
  joinedAt: Timestamp;
  isModerator: boolean;
  lastSeen: Timestamp;
}

export interface FirestoreVote {
  participantId: string;
  value: string;
}
