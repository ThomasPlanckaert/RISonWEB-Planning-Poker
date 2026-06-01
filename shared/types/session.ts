export interface Participant {
  id: string;
  username: string;
  connected: boolean;
  isModerator: boolean;
}

export interface Session {
  id: string;
  name?: string;
  moderatorId: string;
  cardSet: string[];
  currentStory?: string;
  revealed: boolean;
  participants: Participant[];
  votes: Record<string, string>;
  round: number;
}

/** Client-safe session view with masked votes before reveal */
export interface SessionView {
  session: Session;
  /** Vote values visible to this client (others masked until reveal) */
  votes: Record<string, string | null>;
  participantId: string;
}

export const DEFAULT_CARD_SET = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "34",
  "55",
  "89"
];

export const VOTE_MASK = "__VOTED__";
