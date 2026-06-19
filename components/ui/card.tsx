import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-surface p-4", className)}
      {...props}
    />
  );
}
