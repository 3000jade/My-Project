import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

const spinnerVariants = cva("animate-spin text-[#0F766E]", {
  variants: {
    size: {
      sm: "w-4 h-4",
      default: "w-6 h-6",
      lg: "w-8 h-8",
      xl: "w-10 h-10",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export function Spinner({ className, size, text, centered = false, ...props }) {
  const icon = <Loader2 className={cn(spinnerVariants({ size }), className)} {...props} />;

  if (!text && !centered) {
    return icon;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={text || "Loading"}
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        centered && "py-20 w-full bg-white dark:bg-slate-900 rounded-md border border-[#E2E8F0] dark:border-slate-800 shadow-2xs"
      )}
    >
      <Loader2 className={cn(spinnerVariants({ size: size || "lg" }), className)} {...props} />
      {text && (
        <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider font-sans">
          {text}
        </p>
      )}
    </div>
  );
}

export default Spinner;
