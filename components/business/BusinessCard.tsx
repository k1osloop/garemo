import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Tag,
} from "lucide-react";

import {
  formatPrice,
  getBusinessAvailability,
  getProductImage,
} from "@/lib/business-display";
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

  return (
    <Link className="block" href={`/businesses/${business.id}`}>
      <Card className="h-full overflow-hidden p-0 transition-colors hover:border-brand hover:shadow-sm">
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
                    Verificado
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
              <p className="line-clamp-1 text-sm font-semibold">
                {featuredProduct.name}
              </p>
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
          <p className="flex items-center gap-1 text-sm text-muted">
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
      </Card>
    </Link>
  );
}
