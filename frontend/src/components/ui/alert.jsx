import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const alertVariants = cva(
  "relative w-full rounded-lg border p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-white text-[#1E293B] border-[#E2E8F0]",
        warning: "bg-amber-50 text-amber-900 border-amber-200 [&>svg]:text-amber-600",
        destructive: "bg-red-50 text-red-900 border-red-200 [&>svg]:text-[#DC2626]",
        teal: "bg-teal-50 text-[#0F766E] border-teal-200 [&>svg]:text-[#0F766E]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs leading-relaxed opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export default Alert;
