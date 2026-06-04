import { collection, doc, getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./config";

let db: ReturnType<typeof getFirestore> | null = null;

export function getDb() {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

export function sessionRef(roomCode: string) {
  return doc(getDb(), "sessions", normalizeRoomCode(roomCode));
}

export function participantsRef(roomCode: string) {
  return collection(getDb(), "sessions", normalizeRoomCode(roomCode), "participants");
}

export function participantRef(roomCode: string, uid: string) {
  return doc(getDb(), "sessions", normalizeRoomCode(roomCode), "participants", uid);
}

export function votesRef(roomCode: string) {
  return collection(getDb(), "sessions", normalizeRoomCode(roomCode), "votes");
}

export function voteRef(roomCode: string, uid: string) {
  return doc(getDb(), "sessions", normalizeRoomCode(roomCode), "votes", uid);
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function generateRoomCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
