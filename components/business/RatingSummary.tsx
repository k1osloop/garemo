import { Star } from "lucide-react";

import { formatCount, formatRating } from "@/lib/business-display";
import { cn } from "@/lib/utils";
import type { PublicBusiness } from "@/types/database";

type RatingSummaryProps = {
  summary: PublicBusiness["trust_summary"];
  compact?: boolean;
  className?: string;
};

export function RatingSummary({
  className,
  compact = false,
  summary,
}: RatingSummaryProps) {
  const rating = formatRating(summary?.average_rating ?? null);
  const count = summary?.review_count ?? 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700",
        compact && "px-2 py-0.5 text-xs",
        className,
      )}
    >
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      {rating ?? "Nuevo"}
      {count > 0 ? (
        <span className="font-semibold text-amber-700/75">
          ({formatCount(count)})
        </span>
      ) : null}
    </span>
  );
}
