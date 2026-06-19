import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        variant === "primary" &&
          "bg-brand text-brand-foreground hover:bg-teal-800",
        variant === "secondary" &&
          "border border-border bg-surface text-foreground hover:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}
