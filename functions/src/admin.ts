import admin from "firebase-admin";

export function ensureAdminApp(): void {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
}

export function getAdminDb(): admin.firestore.Firestore {
  ensureAdminApp();
  return admin.firestore();
}
