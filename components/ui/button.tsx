import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
        size === "default" && "min-h-11 px-4 text-sm",
        size === "sm" && "min-h-8 px-3 text-xs",
        size === "lg" && "min-h-12 px-8 text-base",
        size === "icon" && "h-10 w-10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-brand text-brand-foreground hover:bg-brand-hover shadow-sm",
        variant === "secondary" &&
          "border border-border bg-surface text-foreground hover:bg-slate-50 hover:text-foreground shadow-sm",
        variant === "ghost" &&
          "hover:bg-slate-100 text-foreground",
        variant === "destructive" &&
          "bg-red-500 text-white hover:bg-red-600 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
