import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle, Tag } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { PublicBusiness } from "@/types/database";

type BusinessCardProps = {
  business: PublicBusiness;
};

export function BusinessCard({ business }: BusinessCardProps) {
  const zone =
    business.location?.campus_zone ??
    business.location?.address_text ??
    "Zona por confirmar";
  const hasWhatsApp = Boolean(business.contact_info?.whatsapp_number);

  return (
    <Link className="block" href={`/businesses/${business.id}`}>
      <Card className="h-full space-y-4 transition-colors hover:border-brand hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="flex items-center gap-1 text-xs font-medium uppercase text-brand">
              <Tag className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {business.category?.name ?? "Categoria"}
              </span>
            </p>
            <h2 className="text-base font-semibold leading-6">
              {business.name}
            </h2>
          </div>
          {hasWhatsApp ? (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-brand">
              <MessageCircle className="h-4 w-4" />
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-muted">
          {business.description}
        </p>
        <p className="flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{zone}</span>
        </p>
        <p className="inline-flex items-center gap-1 text-sm font-medium text-brand">
          Ver perfil
          <ArrowRight className="h-4 w-4" />
        </p>
      </Card>
    </Link>
  );
}
