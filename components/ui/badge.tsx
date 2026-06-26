import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
        variant === "default" &&
          "border-transparent bg-brand text-brand-foreground shadow hover:bg-brand-hover",
        variant === "secondary" &&
          "border-transparent bg-slate-100 text-foreground hover:bg-slate-200",
        variant === "outline" && "text-foreground",
        variant === "success" &&
          "border-transparent bg-green-100 text-green-800",
        variant === "warning" &&
          "border-transparent bg-yellow-100 text-yellow-800",
        className,
      )}
      {...props}
    />
  );
}
