import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer rounded-md",
  {
    variants: {
      variant: {
        default: "bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs active:bg-[#134E4A] [&_svg]:text-white [&_.material-symbols-outlined]:text-white [&_[data-icon]]:text-white",
        coral: "bg-[#FF6B6B] text-[#1E293B] hover:bg-[#EE5A5A] shadow-xs font-bold active:bg-[#E54848]",
        secondary: "bg-[#14B8A6] text-white hover:bg-[#0F766E] shadow-xs",
        outline: "border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC] hover:border-slate-300 shadow-2xs",
        ghost: "text-[#1E293B] hover:bg-slate-100",
        destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-xs",
      },
      size: {
        default: "h-[38px] px-4 py-2",
        sm: "h-[32px] px-3 text-[11px]",
        lg: "h-[44px] px-6 text-sm",
        icon: "h-[38px] w-[38px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const Button = React.forwardRef(
  ({ className, variant, size, loading = false, disabled, children, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading ? "true" : undefined}
        {...props}
      >
        {loading && (
          <Spinner size="sm" className="text-current shrink-0 animate-spin mr-1.5" />
        )}
        <Slottable>{children}</Slottable>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export default Button;
