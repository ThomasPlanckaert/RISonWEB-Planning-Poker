import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { participantsRef } from "../firebase/firestore";
import type { FirestoreParticipant } from "../firebase/types";

export function useParticipants(roomCode: string | undefined) {
  const [participants, setParticipants] = useState<FirestoreParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(participantsRef(roomCode), (snap) => {
      setParticipants(snap.docs.map((d) => d.data() as FirestoreParticipant));
      setLoading(false);
    });

    return unsub;
  }, [roomCode]);

  return { participants, loading };
}
