import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Moon, Share2, Sun, Wifi, WifiOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ModeratorPanel } from "../features/session/components/ModeratorPanel";
import { ParticipantList } from "../features/session/components/ParticipantList";
import { RoundAnnouncement } from "../features/session/components/RoundAnnouncement";
import { VoteCard } from "../features/session/components/VoteCard";
import { usePokerStore } from "../features/session/store/usePokerStore";
import { computeRoundedUpAverage } from "../features/session/utils/vote-average";
import { useSession } from "../hooks/useSession";
import { Button } from "../shared/components/ui/button";
import { Card } from "../shared/components/ui/card";

export function SessionPage({ admin }: { admin?: boolean }) {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const ui = usePokerStore();
  const confettiFiredForRound = useRef<number | null>(null);
  const prevRoundRef = useRef<number | null>(null);
  const [announcedRound, setAnnouncedRound] = useState<number | null>(null);
  const {
    session,
    me,
    connected,
    connecting,
    castVote,
    revealVotes,
    clearVotes,
    nextRound,
    setStory,
    setTitle,
    setDeck,
    removeParticipant,
    leaveRoom
  } = useSession(sessionId, { autoReconnect: true });

  const currentDeck = ui.decks.find(
    (d) => d.values.join("|") === session?.cardSet.join("|")
  ) ?? ui.decks.find((d) => d.id === session?.deckId);

  const showConsensus =
    session?.revealed &&
    session.consensusReached &&
    session.consensusRound === session.round;

  const voteAverage = useMemo(() => {
    if (!session?.revealed) return null;
    return computeRoundedUpAverage(session.participants, session.votes);
  }, [session]);

  useEffect(() => {
    if (!connecting && !session && sessionId) {
      const timer = setTimeout(() => navigate("/"), 1500);
      return () => clearTimeout(timer);
    }
  }, [session, connecting, sessionId, navigate]);

  useEffect(() => {
    if (!session) return;

    const round = session.round;
    if (prevRoundRef.current !== null && round > prevRoundRef.current) {
      setAnnouncedRound(round);
    }
    prevRoundRef.current = round;
  }, [session]);

  useEffect(() => {
    if (!session?.revealed) {
      confettiFiredForRound.current = null;
      return;
    }
    if (!showConsensus) return;
    if (confettiFiredForRound.current === session.round) return;

    confettiFiredForRound.current = session.round;
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    toast.success("Consensus reached!", {
      description: "Everyone picked the same estimate."
    });
  }, [session?.revealed, session?.round, showConsensus]);

  const votedCount = useMemo(() => {
    if (!session) return 0;
    return session.participants.filter((p) => session.votes[p.id] != null).length;
  }, [session]);

  if (!session || !me || !currentDeck) {
    return (
      <main className="grid min-h-screen place-content-center text-slate-600 dark:text-slate-300">
        {connecting ? "Connecting to room…" : "Loading session…"}
      </main>
    );
  }

  const reveal = () => {
    revealVotes();
    toast("Revealing votes…");
  };

  const myVote = session.votes[me.id];
  const displayVote = myVote === "__voted__" ? null : myVote;

  const handleLeave = () => {
    if (window.confirm("Leave this room?")) {
      leaveRoom();
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-4 py-5 md:px-8 md:py-8">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Round {session.round} · Room {session.id}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{session.title}</h1>
          {session.story ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">{session.story}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-slate-600 dark:text-slate-300"
            title={connected ? "Connected" : "Reconnecting…"}
          >
            {connected ? <Wifi size={14} /> : <WifiOff size={14} className="text-amber-500" />}
            {connected ? "Live" : "Offline"}
          </span>
          <Button variant="ghost" onClick={() => ui.toggleTheme()} aria-label="Toggle theme">
            {ui.darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const url = `${window.location.origin}/session/${session.id}`;
              await navigator.clipboard.writeText(url);
              toast.success("Room link copied");
            }}
          >
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {votedCount}/{session.participants.length} voted
                </p>
                {session.revealed && voteAverage != null && (
                  <p className="text-sm font-semibold text-violet-700 dark:text-violet-200">
                    Average estimate: {voteAverage}
                  </p>
                )}
                {session.revealed && voteAverage == null && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Average unavailable (non-numeric cards)
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {me.isModerator && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => clearVotes()}>
                      Reset
                    </Button>
                    <Button size="sm" onClick={reveal}>
                      Reveal
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {currentDeck.values.map((value) => (
                <VoteCard
                  key={value}
                  value={value}
                  selected={displayVote === value}
                  disabled={session.revealed}
                  onClick={() => castVote(value)}
                />
              ))}
            </div>
          </Card>

          <ParticipantList
            participants={session.participants}
            votes={session.votes}
            revealed={session.revealed}
            canRemoveParticipants={me.isModerator}
            onRemoveParticipant={(id) => {
              if (window.confirm("Remove this participant from the room?")) {
                removeParticipant(id);
              }
            }}
          />
        </section>

        <section className="space-y-4">
          {me.isModerator && admin && (
            <ModeratorPanel
              me={me}
              session={session}
              decks={ui.decks}
              onTitle={(v) => setTitle(v)}
              onStory={(v) => setStory(v)}
              onDeck={(v) => setDeck(v)}
              onReveal={reveal}
              onClear={() => clearVotes()}
              onNextRound={() => nextRound()}
              onRemove={(id) => {
                if (window.confirm("Remove this participant from the room?")) {
                  removeParticipant(id);
                }
              }}
              onAddDeck={(name, values) => {
                const deck = ui.addCustomDeck(name, values);
                setDeck(deck.id);
              }}
            />
          )}

          <Card className="p-4">
            <p className="mb-3 text-xs uppercase text-slate-500 dark:text-slate-400">Quick actions</p>
            <div className="grid gap-2">
              {!admin && me.isModerator && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/session/${session.id}/admin`)}
                >
                  Open Moderator Dashboard
                </Button>
              )}
              {me.isModerator && (
                <Button variant="ghost" onClick={() => nextRound()}>
                  New Round
                </Button>
              )}
              <Button variant="ghost" className="text-red-600 dark:text-red-300" onClick={handleLeave}>
                <LogOut size={16} className="mr-2" />
                Leave room
              </Button>
            </div>
          </Card>
        </section>
      </div>

      <RoundAnnouncement round={announcedRound} onComplete={() => setAnnouncedRound(null)} />

      <AnimatePresence>
        {showConsensus && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-800 backdrop-blur dark:border-emerald-300/40 dark:text-emerald-100"
          >
            Consensus reached!
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
