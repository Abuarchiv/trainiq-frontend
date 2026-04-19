import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(
  ({ className, open, onOpenChange, children, ...props }, ref) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/20" onClick={() => onOpenChange?.(false)} />
        <div
          ref={ref}
          className={cn(
            "fixed inset-y-0 right-0 w-80 bg-bg border-l border-border p-4",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);
Sheet.displayName = "Sheet";

export { Sheet };
