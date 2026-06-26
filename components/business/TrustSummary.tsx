import { BadgeCheck, MessageCircle, Star } from "lucide-react";

import { formatCount, formatRating } from "@/lib/business-display";
import { cn } from "@/lib/utils";
import type { PublicBusiness } from "@/types/database";

type TrustSummaryProps = {
  business: PublicBusiness;
  compact?: boolean;
};

export function TrustSummary({ business, compact = false }: TrustSummaryProps) {
  const summary = business.trust_summary;
  const rating = formatRating(summary?.average_rating ?? null);
  const reviewCount = summary?.review_count ?? 0;
  const clickCount = summary?.whatsapp_click_count ?? 0;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "grid gap-2 text-sm",
          compact ? "grid-cols-1" : "sm:grid-cols-4",
        )}
      >
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-muted">
          <BadgeCheck className="h-4 w-4 text-brand" />
          {business.is_verified ? "Verificado" : "No verificado"}
        </span>
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-muted">
          <Star className="h-4 w-4 text-brand" />
          {rating ? `${rating} (${formatCount(reviewCount)})` : "Sin reseñas"}
        </span>
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-muted" title="Contactos de WhatsApp generados">
          <MessageCircle className="h-4 w-4 text-brand" />
          {clickCount > 0
            ? `${formatCount(clickCount)} contactos`
            : "Nuevo"}
        </span>
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-muted" title="Antigüedad del negocio en Garemo">
          <span className="h-4 w-4 text-brand font-bold flex items-center justify-center">#</span>
          Desde {new Date(business.created_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
        </span>
      </div>
      {!compact && (
        <div className="flex justify-end">
          <button 
            type="button" 
            className="text-xs text-muted-foreground hover:text-red-500 hover:underline transition-colors"
            onClick={() => alert("Función de reporte en desarrollo (MVP).")}
          >
            Reportar negocio
          </button>
        </div>
      )}
    </div>
  );
}
