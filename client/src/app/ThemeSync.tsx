import { useEffect } from "react";
import { usePokerStore } from "../features/session/store/usePokerStore";

export function ThemeSync() {
  const darkMode = usePokerStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  return null;
}
