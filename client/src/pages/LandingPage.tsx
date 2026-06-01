import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "../shared/components/ui/button";
import { Card } from "../shared/components/ui/card";
import { Input } from "../shared/components/ui/input";
import { loadIdentity } from "../services/storage";
import { useSocketSession } from "../hooks/useSocketSession";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function LandingPage() {
  const navigate = useNavigate();
  const stored = loadIdentity();
  const [username, setUsername] = useState(stored.username ?? "");
  const [roomCode, setRoomCode] = useState(stored.roomCode ?? generateRoomCode());
  const { createRoom, joinRoom, connecting } = useSocketSession(undefined, {
    autoReconnect: false
  });

  const canContinue = useMemo(() => username.trim().length >= 2, [username]);
  const normalizedCode = useMemo(
    () => roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""),
    [roomCode]
  );

  useEffect(() => {
    if (stored.roomCode && stored.username) {
      navigate(`/session/${stored.roomCode.toUpperCase()}`);
    }
  }, [navigate, stored.roomCode, stored.username]);

  const enter = async (asModerator: boolean) => {
    if (!canContinue || !normalizedCode) return;

    if (asModerator) {
      const created = await createRoom(username.trim());
      if (created) navigate(`/session/${created}/admin`);
    } else {
      const joined = await joinRoom(username.trim(), normalizedCode);
      if (joined) navigate(`/session/${normalizedCode}`);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
      <Card className="grid w-full gap-8 overflow-hidden border-white/20 bg-gradient-to-br from-violet-500/10 via-slate-900/70 to-cyan-500/10 p-8 lg:grid-cols-2">
        <section className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-100">
            <Sparkles className="h-3.5 w-3.5" />
            Collaborative Estimation
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Planning Poker for modern teams
          </h1>
          <p className="max-w-lg text-slate-300">
            Join instantly, estimate together, reveal with confidence, and celebrate consensus with
            polished collaborative UX.
          </p>
        </section>

        <Card className="space-y-4 border-white/10 bg-slate-950/40 p-6">
          <Input
            placeholder="Your display name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            placeholder="Room code (e.g. AB12CD)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={12}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button disabled={!canContinue || connecting} onClick={() => enter(false)}>
              Join Room
            </Button>
            <Button
              disabled={!canContinue || connecting}
              variant="secondary"
              onClick={() => enter(true)}
            >
              Create Room
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Share the room code with your team. Your name and identity are saved locally for
            reconnection.
          </p>
        </Card>
      </Card>
    </main>
  );
}
