import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type InputProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
};

export function Input({ className, id, label, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="grid gap-2 text-sm font-medium" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        className={cn(
          "min-h-11 rounded-lg border border-border bg-surface px-3 text-base outline-none transition-colors",
          "placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
          className,
        )}
        {...props}
      />
    </label>
  );
}
