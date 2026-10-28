import * as React from "react";
import { cn } from "@/utils/cn";

export const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-[40px] w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#1E293B] shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#64748B] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-1 focus-visible:ring-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export default Input;
