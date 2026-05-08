import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "../shared/components/ui/button";
import { Card } from "../shared/components/ui/card";
import { Input } from "../shared/components/ui/input";
import { usePokerStore } from "../features/session/store/usePokerStore";

export function LandingPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).slice(2, 8));
  const joinSession = usePokerStore((s) => s.joinSession);

  const canContinue = useMemo(() => username.trim().length >= 2, [username]);

  const enter = (asModerator: boolean) => {
    if (!canContinue) return;
    joinSession({ sessionId, username: username.trim(), asModerator });
    navigate(`/session/${sessionId}${asModerator ? "/admin" : ""}`);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
      <Card className="grid w-full gap-8 overflow-hidden border-white/20 bg-gradient-to-br from-violet-500/10 via-slate-900/70 to-cyan-500/10 p-8 lg:grid-cols-2">
        <section className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-100">
            <Sparkles className="h-3.5 w-3.5" />
            Collaborative Estimation
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Planning Poker for modern teams</h1>
          <p className="max-w-lg text-slate-300">
            Join instantly, estimate together, reveal with confidence, and celebrate consensus with polished collaborative UX.
          </p>
        </section>

        <Card className="space-y-4 border-white/10 bg-slate-950/40 p-6">
          <Input placeholder="Your display name" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="Session ID" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button disabled={!canContinue} onClick={() => enter(false)}>Join Session</Button>
            <Button disabled={!canContinue} variant="secondary" onClick={() => enter(true)}>Create as Moderator</Button>
          </div>
          <p className="text-xs text-slate-400">No accounts. No backend. Identity is local to this browser.</p>
        </Card>
      </Card>
    </main>
  );
}
