import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../../../shared/components/ui/button";
import { Card } from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import type { Deck, PokerSession } from "../types/session";
import type { Participant } from "../types/session";

interface ModeratorPanelProps {
  session: PokerSession;
  decks: Deck[];
  me: Participant;
  onTitle: (value: string) => void;
  onStory: (value: string) => void;
  onDeck: (value: string) => void;
  onReveal: () => void;
  onClear: () => void;
  onNextRound: () => void;
  onRemove: (id: string) => void;
  onAddDeck: (name: string, values: string[]) => void;
}

export function ModeratorPanel(props: ModeratorPanelProps) {
  const {
    session,
    decks,
    onTitle,
    onStory,
    onDeck,
    onReveal,
    onClear,
    onNextRound,
    onRemove,
    onAddDeck
  } = props;

  const [title, setTitle] = useState(session.title);
  const [story, setStory] = useState(session.story);
  const titleFocused = useRef(false);
  const storyFocused = useRef(false);

  useEffect(() => {
    if (!titleFocused.current) setTitle(session.title);
  }, [session.title]);

  useEffect(() => {
    if (!storyFocused.current) setStory(session.story);
  }, [session.story]);

  const commitTitle = () => {
    if (title !== session.title) onTitle(title);
  };

  const commitStory = () => {
    if (story !== session.story) onStory(story);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="space-y-4 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-200">
          Moderator Controls
        </p>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => {
            titleFocused.current = true;
          }}
          onBlur={() => {
            titleFocused.current = false;
            commitTitle();
          }}
          placeholder="Session title"
        />
        <Input
          value={story}
          onChange={(e) => setStory(e.target.value)}
          onFocus={() => {
            storyFocused.current = true;
          }}
          onBlur={() => {
            storyFocused.current = false;
            commitStory();
          }}
          placeholder="Current story (optional)"
        />
        <select
          value={session.deckId}
          onChange={(e) => onDeck(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-white"
        >
          {decks.map((deck) => (
            <option className="bg-slate-900" key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClear}>
            Reset Votes
          </Button>
          <Button variant="secondary" onClick={onReveal}>
            Reveal
          </Button>
          <Button className="col-span-2" onClick={onNextRound}>
            Start New Round
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-300">Participants</p>
          {session.participants.map((p) => (
            <div
              className="flex items-center justify-between text-sm text-slate-800 dark:text-slate-100"
              key={p.id}
            >
              <span>{p.name}</span>
              {!p.isModerator && (
                <Button variant="ghost" size="sm" onClick={() => onRemove(p.id)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const name = window.prompt("Custom deck name");
            const values = window.prompt("Card values comma separated (e.g. 1,2,3,5)");
            if (name && values) onAddDeck(name, values.split(",").map((v) => v.trim()));
          }}
        >
          Add Custom Deck
        </Button>
      </Card>
    </motion.div>
  );
}
