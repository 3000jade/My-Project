import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors select-none font-sans",
  {
    variants: {
      variant: {
        default: "bg-teal-50 text-[#0F766E] border border-teal-200",
        primary: "bg-[#0F766E] text-white",
        coral: "bg-rose-50 text-[#FF6B6B] border border-rose-200 font-bold",
        secondary: "bg-slate-100 text-[#1E293B] border border-[#E2E8F0]",
        outline: "text-[#1E293B] border border-[#E2E8F0] bg-white",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border border-amber-200",
        destructive: "bg-rose-50 text-rose-700 border border-rose-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export default Badge;
