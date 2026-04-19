import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "success" | "danger";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded px-2 py-0.5 text-[10px] tracking-widest uppercase font-sans",
          variant === "default" && "bg-surface text-textDim border border-border",
          variant === "outline" && "border border-border text-textDim",
          variant === "success" && "bg-blueDim text-blue border border-blue",
          variant === "danger" && "bg-red-50 text-danger border border-danger",
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
