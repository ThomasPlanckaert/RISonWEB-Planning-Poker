import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User
} from "firebase/auth";
import { getFirebaseApp } from "./config";

const auth = getAuth(getFirebaseApp());

export function getFirebaseAuth() {
  return auth;
}

export async function ensureAnonymousAuth(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUid(): string | null {
  return auth.currentUser?.uid ?? null;
}
