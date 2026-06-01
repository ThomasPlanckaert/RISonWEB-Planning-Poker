export type CardValue = string;

export interface Deck {
  id: string;
  name: string;
  values: CardValue[];
  builtIn?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isModerator?: boolean;
  isActive?: boolean;
}

export interface PokerSession {
  id: string;
  title: string;
  story: string;
  deckId: string;
  cardSet: string[];
  participants: Participant[];
  votes: Record<string, CardValue | null>;
  revealed: boolean;
  round: number;
}
