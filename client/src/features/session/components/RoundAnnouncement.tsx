import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface RoundAnnouncementProps {
  round: number | null;
  onComplete?: () => void;
}

export function RoundAnnouncement({ round, onComplete }: RoundAnnouncementProps) {
  useEffect(() => {
    if (round == null) return;
    const timer = window.setTimeout(() => onComplete?.(), 1600);
    return () => window.clearTimeout(timer);
  }, [round, onComplete]);

  return (
    <AnimatePresence>
      {round != null && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0.75] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_70%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative flex flex-col items-center px-6 text-center"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <motion.div
              className="mb-2 flex items-center gap-4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-red-500 to-red-600 sm:w-24" />
              <motion.span
                className="text-xs font-bold uppercase tracking-[0.35em] text-red-400 sm:text-sm"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                Ding ding
              </motion.span>
              <span className="h-px w-16 bg-gradient-to-l from-transparent via-red-500 to-red-600 sm:w-24" />
            </motion.div>

            <motion.p
              className="text-[10px] font-semibold uppercase tracking-[0.5em] text-amber-200/90 sm:text-xs"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              New round
            </motion.p>

            <motion.h2
              className="mt-1 bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 bg-clip-text text-7xl font-black uppercase leading-none tracking-tight text-transparent drop-shadow-[0_0_40px_rgba(251,191,36,0.55)] sm:text-8xl md:text-9xl"
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.08 }}
            >
              Round {round}
            </motion.h2>

            <motion.p
              className="mt-4 max-w-md text-sm font-bold uppercase tracking-[0.25em] text-red-300 sm:text-base"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              Place your estimates
            </motion.p>

            <motion.div
              className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-red-950/80 sm:w-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 via-amber-400 to-red-600"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-red-600/30 sm:inset-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: [0, 0.6, 0.35], scale: 1 }}
            transition={{ duration: 0.6 }}
          />
          <motion.div
            className="pointer-events-none absolute inset-4 rounded-[2rem] border border-amber-500/20 sm:inset-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0.2] }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
