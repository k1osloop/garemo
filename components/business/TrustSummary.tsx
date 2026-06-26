"use client";

import { useState } from "react";
import { BadgeCheck, MessageCircle, Star } from "lucide-react";

import { formatCount, formatRating } from "@/lib/business-display";
import { cn } from "@/lib/utils";
import type { PublicBusiness } from "@/types/database";
import { ReportModal } from "./ReportModal";

type TrustSummaryProps = {
  business: PublicBusiness;
  compact?: boolean;
};

export function TrustSummary({ business, compact = false }: TrustSummaryProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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
        <span className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5",
          business.status === 'approved' || business.status === 'active' || business.is_verified 
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        )}>
          {business.status === 'approved' || business.status === 'active' || business.is_verified ? (
            <>
              <BadgeCheck className="h-4 w-4 text-green-600" />
              Verificado por Garemo
            </>
          ) : (
            <>
              <BadgeCheck className="h-4 w-4 text-amber-600" />
              Sin verificar
            </>
          )}
        </span>
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-muted" title="Calificación de usuarios">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          {rating ? `${rating} (${formatCount(reviewCount)} opiniones)` : "Aún no hay opiniones"}
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
            onClick={() => setIsReportModalOpen(true)}
          >
            Reportar negocio
          </button>
        </div>
      )}
      
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetId={business.id}
        targetType="business"
      />
    </div>
  );
}
