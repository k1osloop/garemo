import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = ComponentPropsWithoutRef<"section"> & {
  title?: string;
  description?: string;
};

export function SectionCard({
  children,
  className,
  description,
  title,
  ...props
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-3xl border border-border/70 bg-surface p-4 shadow-sm sm:p-5",
        className,
      )}
      {...props}
    >
      {title || description ? (
        <div className="mb-4 space-y-1">
          {title ? (
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
