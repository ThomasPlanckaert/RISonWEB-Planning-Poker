const USERNAME_KEY = "planning-poker:username";
const ROOM_CODE_KEY = "planning-poker:roomCode";

export interface StoredIdentity {
  username: string;
  roomCode: string;
}

export function saveIdentity(identity: StoredIdentity): void {
  localStorage.setItem(USERNAME_KEY, identity.username);
  localStorage.setItem(ROOM_CODE_KEY, identity.roomCode);
}

export function loadIdentity(): Partial<StoredIdentity> {
  return {
    username: localStorage.getItem(USERNAME_KEY) ?? undefined,
    roomCode: localStorage.getItem(ROOM_CODE_KEY) ?? undefined
  };
}

export function clearIdentity(): void {
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(ROOM_CODE_KEY);
}
