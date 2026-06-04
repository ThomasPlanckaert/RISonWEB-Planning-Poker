import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { votesRef } from "../firebase/firestore";
import type { FirestoreVote } from "../firebase/types";

export function useVotes(roomCode: string | undefined) {
  const [votes, setVotes] = useState<FirestoreVote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode) {
      setVotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(votesRef(roomCode), (snap) => {
      setVotes(snap.docs.map((d) => d.data() as FirestoreVote));
      setLoading(false);
    });

    return unsub;
  }, [roomCode]);

  return { votes, loading };
}
