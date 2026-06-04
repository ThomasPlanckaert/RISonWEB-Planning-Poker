import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/80 shadow-lg backdrop-blur-md",
        "dark:border-white/10 dark:bg-white/5 dark:shadow-[0_12px_40px_-20px_rgba(30,41,59,0.8)]",
        className
      )}
      {...props}
    />
  );
}
