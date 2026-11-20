import * as React from "react";
import { cn } from "@/utils/cn";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md bg-slate-200/80 motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

export default Skeleton;
