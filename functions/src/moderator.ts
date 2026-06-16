import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminDb } from "./admin";
import { evaluateConsensus } from "./consensus";
import { analyzeRevealStats } from "./vote-stats";

function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function requireAuth(request: CallableRequest): string {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  return request.auth.uid;
}

function sessionRef(roomCode: string): DocumentReference {
  return getAdminDb().doc(`sessions/${normalizeRoomCode(roomCode)}`);
}

async function assertModerator(roomCode: string, uid: string) {
  const code = normalizeRoomCode(roomCode);
  const snap = await sessionRef(code).get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Room not found.");
  }
  const data = snap.data()!;
  if (data.moderatorUid !== uid) {
    throw new HttpsError("permission-denied", "Only the moderator can perform this action.");
  }
  return { code, data, ref: snap.ref };
}

async function loadVotesAndParticipants(code: string) {
  const db = getAdminDb();
  const [participantsSnap, votesSnap] = await Promise.all([
    db.collection(`sessions/${code}/participants`).get(),
    db.collection(`sessions/${code}/votes`).get()
  ]);

  const participants = participantsSnap.docs.map((doc) => {
    const d = doc.data();
    const lastSeenMs =
      d.lastSeen && typeof d.lastSeen.toMillis === "function" ? d.lastSeen.toMillis() : null;
    return { uid: doc.id, lastSeenMs };
  });

  const votes = votesSnap.docs.map((doc) => ({
    participantId: doc.id,
    value: doc.data().value as string
  }));

  return { participants, votes };
}

async function applyConsensus(
  code: string,
  revealed: boolean,
  round: number,
  previousStreak: number
) {
  const { participants, votes } = await loadVotesAndParticipants(code);
  const result = evaluateConsensus({ revealed, participants, votes });

  const nextStreak = result.reached ? previousStreak + 1 : 0;

  await sessionRef(code).update({
    consensusReached: result.reached,
    consensusRound: result.reached ? round : null,
    consensusVote: result.reached ? result.vote : null,
    consensusStreak: nextStreak
  });

  return { ...result, streak: nextStreak };
}

async function updateRevealStats(
  code: string,
  sessionData: FirebaseFirestore.DocumentData,
  consensusReached: boolean,
  votes: Array<{ participantId: string; value: string }>
) {
  const revealStats = analyzeRevealStats(votes);
  const currentCounts =
    (sessionData.statsMatchCounts as Record<string, number> | undefined) ?? {};
  const currentPairCounts =
    (sessionData.statsPairCounts as Record<string, number> | undefined) ?? {};
  const nextCounts = { ...currentCounts };
  const nextPairCounts = { ...currentPairCounts };

  for (const uid of revealStats.matchedUids) {
    nextCounts[uid] = (nextCounts[uid] ?? 0) + 1;
  }

  for (const key of revealStats.pairKeys) {
    nextPairCounts[key] = (nextPairCounts[key] ?? 0) + 1;
  }

  const updates: Record<string, unknown> = {
    statsMatchCounts: nextCounts,
    statsPairCounts: nextPairCounts
  };

  if (consensusReached) {
    updates.statsConsensuses = FieldValue.increment(1);
  }
  if (revealStats.closeOne && !consensusReached) {
    updates.statsCloseOnes = FieldValue.increment(1);
  }

  await sessionRef(code).update(updates);
}

export async function handleRevealVotes(request: CallableRequest) {
  const uid = requireAuth(request);
  const roomCode = request.data?.roomCode as string | undefined;
  if (!roomCode) throw new HttpsError("invalid-argument", "roomCode is required.");

  const { code, data, ref } = await assertModerator(roomCode, uid);
  const round = (data.round as number) ?? 1;
  const previousStreak = (data.consensusStreak as number) ?? 0;

  const { votes } = await loadVotesAndParticipants(code);

  await ref.update({ revealed: true });
  const consensus = await applyConsensus(code, true, round, previousStreak);
  await updateRevealStats(code, data, consensus.reached, votes);

  return { ok: true, consensus };
}

export async function handleResetVotes(request: CallableRequest) {
  const uid = requireAuth(request);
  const roomCode = request.data?.roomCode as string | undefined;
  const newRound = Boolean(request.data?.newRound);
  if (!roomCode) throw new HttpsError("invalid-argument", "roomCode is required.");

  const { code, data, ref } = await assertModerator(roomCode, uid);
  const db = getAdminDb();
  const votesSnap = await db.collection(`sessions/${code}/votes`).get();
  const batch = db.batch();
  votesSnap.docs.forEach((doc) => batch.delete(doc.ref));

  const nextRound = newRound ? ((data.round as number) ?? 1) + 1 : (data.round as number) ?? 1;
  batch.update(ref, {
    revealed: false,
    round: nextRound,
    consensusReached: false,
    consensusRound: null,
    consensusVote: null
  });
  await batch.commit();

  return { ok: true, round: nextRound };
}

export async function handleUpdateSessionSettings(request: CallableRequest) {
  const uid = requireAuth(request);
  const roomCode = request.data?.roomCode as string | undefined;
  if (!roomCode) throw new HttpsError("invalid-argument", "roomCode is required.");

  const { code, ref } = await assertModerator(roomCode, uid);
  const title = request.data?.title as string | undefined;
  const currentStory = request.data?.currentStory as string | undefined;
  const cardSet = request.data?.cardSet as string[] | undefined;

  const updates: Record<string, unknown> = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.length > 200) {
      throw new HttpsError("invalid-argument", "Invalid title.");
    }
    updates.title = title;
  }

  if (currentStory !== undefined) {
    if (typeof currentStory !== "string" || currentStory.length > 2000) {
      throw new HttpsError("invalid-argument", "Invalid story.");
    }
    updates.currentStory = currentStory;
  }

  if (cardSet !== undefined) {
    if (!Array.isArray(cardSet) || cardSet.length === 0 || cardSet.length > 30) {
      throw new HttpsError("invalid-argument", "Invalid card set.");
    }
    const db = getAdminDb();
    const votesSnap = await db.collection(`sessions/${code}/votes`).get();
    const batch = db.batch();
    votesSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.update(ref, {
      ...updates,
      cardSet,
      revealed: false,
      consensusReached: false,
      consensusRound: null,
      consensusVote: null
    });
    await batch.commit();
    return { ok: true };
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpsError("invalid-argument", "No settings to update.");
  }

  await ref.update(updates);
  return { ok: true };
}

export async function handleRemoveParticipant(request: CallableRequest) {
  const uid = requireAuth(request);
  const roomCode = request.data?.roomCode as string | undefined;
  const participantId = request.data?.participantId as string | undefined;
  if (!roomCode || !participantId) {
    throw new HttpsError("invalid-argument", "roomCode and participantId are required.");
  }

  const { code, data } = await assertModerator(roomCode, uid);
  if (participantId === uid) {
    throw new HttpsError("failed-precondition", "Cannot remove yourself.");
  }
  if (participantId === data.moderatorUid) {
    throw new HttpsError("failed-precondition", "Cannot remove the moderator.");
  }

  const db = getAdminDb();
  const batch = db.batch();
  batch.delete(db.doc(`sessions/${code}/participants/${participantId}`));
  batch.delete(db.doc(`sessions/${code}/votes/${participantId}`));
  await batch.commit();

  return { ok: true };
}

export async function handleTransferModerator(request: CallableRequest) {
  const uid = requireAuth(request);
  const roomCode = request.data?.roomCode as string | undefined;
  const newModeratorUid = request.data?.newModeratorUid as string | undefined;
  if (!roomCode || !newModeratorUid) {
    throw new HttpsError("invalid-argument", "roomCode and newModeratorUid are required.");
  }

  const { code, ref } = await assertModerator(roomCode, uid);
  const db = getAdminDb();
  const newModRef = db.doc(`sessions/${code}/participants/${newModeratorUid}`);
  const newModSnap = await newModRef.get();
  if (!newModSnap.exists) {
    throw new HttpsError("not-found", "Target participant not found in this room.");
  }

  const batch = db.batch();
  batch.update(ref, { moderatorUid: newModeratorUid });
  batch.update(db.doc(`sessions/${code}/participants/${uid}`), { isModerator: false });
  batch.update(newModRef, { isModerator: true });
  await batch.commit();

  return { ok: true };
}

export async function handleEndSession(request: CallableRequest) {
  const uid = requireAuth(request);
  const roomCode = request.data?.roomCode as string | undefined;
  if (!roomCode) throw new HttpsError("invalid-argument", "roomCode is required.");

  const { ref } = await assertModerator(roomCode, uid);
  await ref.update({ sessionEnded: true });

  return { ok: true };
}
