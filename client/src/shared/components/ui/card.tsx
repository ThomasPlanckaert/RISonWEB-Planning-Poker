import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_12px_40px_-20px_rgba(30,41,59,0.8)]",
        className
      )}
      {...props}
    />
  );
}
