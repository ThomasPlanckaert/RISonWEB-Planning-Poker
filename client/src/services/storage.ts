const USERNAME_KEY = "planning-poker:username";
const ROOM_CODE_KEY = "planning-poker:roomCode";
const PARTICIPANT_ID_KEY = "planning-poker:participantId";

export interface StoredIdentity {
  username: string;
  roomCode: string;
  participantId: string;
}

export function saveIdentity(identity: StoredIdentity): void {
  localStorage.setItem(USERNAME_KEY, identity.username);
  localStorage.setItem(ROOM_CODE_KEY, identity.roomCode);
  localStorage.setItem(PARTICIPANT_ID_KEY, identity.participantId);
}

export function loadIdentity(): Partial<StoredIdentity> {
  return {
    username: localStorage.getItem(USERNAME_KEY) ?? undefined,
    roomCode: localStorage.getItem(ROOM_CODE_KEY) ?? undefined,
    participantId: localStorage.getItem(PARTICIPANT_ID_KEY) ?? undefined
  };
}

export function clearIdentity(): void {
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(ROOM_CODE_KEY);
  localStorage.removeItem(PARTICIPANT_ID_KEY);
}
