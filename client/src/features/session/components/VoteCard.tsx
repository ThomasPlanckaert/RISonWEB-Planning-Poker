import { motion } from "framer-motion";
import { cn } from "../../../shared/lib/utils";

interface VoteCardProps {
  value: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function VoteCard({ value, selected, disabled, onClick }: VoteCardProps) {
  return (
    <motion.button
      whileHover={{ y: -6, rotate: -1 }}
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-20 w-14 rounded-xl border text-lg font-semibold transition",
        selected
          ? "border-violet-400 bg-violet-500 text-white shadow-lg shadow-violet-500/40"
          : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {value}
    </motion.button>
  );
}
