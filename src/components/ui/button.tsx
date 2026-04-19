import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-sans text-xs tracking-widest uppercase transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-blue text-bg border border-blue hover:bg-blue/90",
          variant === "outline" && "border border-border text-textMain hover:border-blue hover:text-blue",
          variant === "ghost" && "text-textDim hover:text-textMain hover:border hover:border-border",
          size === "default" && "h-10 px-4 rounded",
          size === "sm" && "h-8 px-3 rounded text-[10px]",
          size === "lg" && "h-12 px-6 rounded",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
