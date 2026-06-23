import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Star,
  Tag,
} from "lucide-react";

import {
  availabilityClassName,
  formatPrice,
  getBusinessAvailability,
  getProductImage,
} from "@/lib/business-display";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/business/FavoriteButton";
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
  const availability = getBusinessAvailability(business);
  const featuredProduct = business.products.find(
    (product) => product.is_available,
  ) ?? business.products[0] ?? null;
  const imageUrl = getProductImage(featuredProduct);
  const price = featuredProduct
    ? formatPrice(featuredProduct.offer_price ?? featuredProduct.price)
    : null;
  const originalPrice =
    featuredProduct?.offer_price && featuredProduct.price
      ? formatPrice(featuredProduct.price)
      : null;
  const summary = business.trust_summary;

  return (
    <Card className="h-full overflow-hidden p-0 transition-colors hover:border-brand hover:shadow-sm">
      <div className="relative">
        <Link
          aria-label={`Ver perfil de ${business.name}`}
          href={`/businesses/${business.id}`}
        >
          <div className="aspect-[4/3] bg-surface">
            {imageUrl ? (
              // Product images are public DEV/manual URLs validated to HTTPS before render.
              <Image
                alt={featuredProduct?.name ?? business.name}
                className="h-full w-full object-cover"
                height={300}
                src={imageUrl}
                width={400}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-surface text-sm text-muted">
                Imagen pendiente
              </div>
            )}
          </div>
        </Link>
        <FavoriteButton
          businessId={business.id}
          className="absolute right-3 top-3"
          compact
        />
      </div>

      <Link className="block" href={`/businesses/${business.id}`}>
        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-1 text-xs font-medium uppercase text-brand">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  {business.category?.name ?? "Categoria"}
                </span>
                {business.is_verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verificado por Garemo
                  </span>
                ) : null}
              </div>
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
          {featuredProduct ? (
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-semibold">
                  {featuredProduct.name}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    featuredProduct.is_available
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {featuredProduct.is_available ? "Disponible" : "No disponible"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {price ? (
                  <span className="text-sm font-semibold text-foreground">
                    {price}
                  </span>
                ) : null}
                {originalPrice ? (
                  <span className="text-xs text-muted line-through">
                    {originalPrice}
                  </span>
                ) : null}
                {featuredProduct.stock_label ? (
                  <span className="text-xs text-brand">
                    {featuredProduct.stock_label}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="grid gap-2 text-sm">
            <p className="flex items-center gap-1 text-muted">
              <Star className="h-4 w-4 shrink-0 text-brand" />
              <span>
                {summary?.average_rating
                  ? `${summary.average_rating.toFixed(1)} (${summary.review_count})`
                  : "Sin calificaciones todavia"}
              </span>
            </p>
            <p className="flex items-center gap-1 text-muted">
              <MessageCircle className="h-4 w-4 shrink-0 text-brand" />
              <span>
                {summary?.whatsapp_click_count ?? 0} contactos generados
              </span>
            </p>
          </div>
          <p
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm",
              availabilityClassName(availability.tone),
            )}
          >
            <Clock3 className="h-4 w-4 shrink-0" />
            <span>{availability.label}</span>
          </p>
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{zone}</span>
          </p>
          <p className="inline-flex items-center gap-1 text-sm font-medium text-brand">
            Ver perfil
            <ArrowRight className="h-4 w-4" />
          </p>
        </div>
      </Link>
    </Card>
  );
}
