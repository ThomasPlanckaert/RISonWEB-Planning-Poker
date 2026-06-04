import * as React from "react";
import { cn } from "../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
      "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500",
      "dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-400",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
