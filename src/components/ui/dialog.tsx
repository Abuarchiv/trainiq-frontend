import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ className, open, onOpenChange, children, ...props }, ref) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/20" onClick={() => onOpenChange?.(false)} />
        <div
          ref={ref}
          className={cn(
            "relative z-50 w-full max-w-md bg-bg border border-border rounded p-6",
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
Dialog.displayName = "Dialog";

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />
  )
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-sm font-sans font-medium tracking-widest uppercase text-textMain", className)}
      {...props}
    />
  )
);
DialogTitle.displayName = "DialogTitle";

export { Dialog, DialogHeader, DialogTitle };
