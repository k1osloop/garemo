import { BadgeCheck, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PublicBusiness } from "@/types/database";

type BusinessStatusBadgeProps = {
  business: Pick<PublicBusiness, "is_verified" | "status">;
  className?: string;
};

export function BusinessStatusBadge({
  business,
  className,
}: BusinessStatusBadgeProps) {
  const isVerified =
    business.is_verified ||
    business.status === "approved" ||
    business.status === "active";

  if (isVerified) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700",
          className,
        )}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        Verificado por Garemo
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700",
        className,
      )}
    >
      <ShieldAlert className="h-3.5 w-3.5" />
      Sin verificar
    </span>
  );
}
