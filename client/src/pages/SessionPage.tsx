import { useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Share2, Sun, Wifi, WifiOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ModeratorPanel } from "../features/session/components/ModeratorPanel";
import { ParticipantList } from "../features/session/components/ParticipantList";
import { VoteCard } from "../features/session/components/VoteCard";
import { usePokerStore } from "../features/session/store/usePokerStore";
import { useSocketSession } from "../hooks/useSocketSession";
import { Button } from "../shared/components/ui/button";
import { Card } from "../shared/components/ui/card";

export function SessionPage({ admin }: { admin?: boolean }) {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const ui = usePokerStore();
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
    removeParticipant
  } = useSocketSession(sessionId, { autoReconnect: true });

  const currentDeck = ui.decks.find(
    (d) => d.values.join("|") === session?.cardSet.join("|")
  ) ?? ui.decks.find((d) => d.id === session?.deckId);

  useEffect(() => {
    if (!connecting && !session && sessionId) {
      const timer = setTimeout(() => navigate("/"), 1500);
      return () => clearTimeout(timer);
    }
  }, [session, connecting, sessionId, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", ui.darkMode);
  }, [ui.darkMode]);

  useEffect(() => {
    if (session && session.revealed && ui.celebrationRound === session.round) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      toast.success("Consensus reached!", {
        description: "Everyone picked the same estimate."
      });
    }
  }, [session, ui.celebrationRound]);

  const votedCount = useMemo(() => {
    if (!session) return 0;
    return session.participants.filter((p) => session.votes[p.id] != null).length;
  }, [session]);

  if (!session || !me || !currentDeck) {
    return (
      <main className="grid min-h-screen place-content-center text-slate-300">
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-4 py-5 md:px-8 md:py-8">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-300">
            Round {session.round} · Room {session.id}
          </p>
          <h1 className="text-2xl font-bold text-white">{session.title}</h1>
          <p className="text-sm text-slate-300">{session.story}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-slate-300"
            title={connected ? "Connected" : "Reconnecting…"}
          >
            {connected ? <Wifi size={14} /> : <WifiOff size={14} className="text-amber-300" />}
            {connected ? "Live" : "Offline"}
          </span>
          <Button variant="ghost" onClick={() => ui.toggleTheme()}>
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
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-300">
                {votedCount}/{session.participants.length} voted
              </p>
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
                  value={session.revealed ? value : "?"}
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
              onRemove={(id) => removeParticipant(id)}
              onAddDeck={(name, values) => {
                const deck = ui.addCustomDeck(name, values);
                setDeck(deck.id);
              }}
            />
          )}

          <Card className="p-4">
            <p className="mb-3 text-xs uppercase text-slate-400">Quick actions</p>
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
            </div>
          </Card>
        </section>
      </div>

      <AnimatePresence>
        {session.revealed && ui.celebrationRound === session.round && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-100 backdrop-blur"
          >
            Consensus reached!
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
