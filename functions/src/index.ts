import { onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import {
  handleEndSession,
  handleRevealVotes,
  handleRemoveParticipant,
  handleResetVotes,
  handleTransferModerator,
  handleUpdateSessionSettings
} from "./moderator";
import { ensureAdminApp } from "./admin";

ensureAdminApp();

const callableOptions = {
  cors: true
};

setGlobalOptions({
  region: process.env.FUNCTIONS_REGION ?? "us-central1",
  maxInstances: 10
});

export const revealVotes = onCall(callableOptions, handleRevealVotes);
export const resetVotes = onCall(callableOptions, handleResetVotes);
export const updateSessionSettings = onCall(callableOptions, handleUpdateSessionSettings);
/** Kept for backwards compatibility; client uses Firestore rules for removal. */
export const removeParticipant = onCall(callableOptions, handleRemoveParticipant);
export const transferModerator = onCall(callableOptions, handleTransferModerator);
export const endSession = onCall(callableOptions, handleEndSession);
