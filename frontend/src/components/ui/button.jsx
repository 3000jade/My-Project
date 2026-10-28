import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs active:bg-[#134E4A]",
        coral: "bg-[#FF6B6B] text-[#1E293B] hover:bg-[#EE5A5A] shadow-xs font-bold active:bg-[#E54848]",
        secondary: "bg-[#14B8A6] text-white hover:bg-[#0F766E] shadow-xs",
        outline: "border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC] hover:border-slate-300 shadow-2xs",
        ghost: "text-[#1E293B] hover:bg-slate-100",
        destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-xs",
      },
      size: {
        default: "h-[40px] px-4 py-2",
        sm: "h-[34px] rounded-md px-3 text-[11px]",
        lg: "h-[48px] rounded-lg px-6 text-sm",
        icon: "h-[40px] w-[40px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export default Button;
