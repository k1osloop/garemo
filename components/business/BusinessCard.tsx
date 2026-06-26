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
  getBusinessDisplayImage,
  getBusinessAvailability,
} from "@/lib/business-display";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  const imageUrl = getBusinessDisplayImage(business, featuredProduct);
  const summary = business.trust_summary;

  const lowestPrice = business.products
    .filter(p => p.is_available && (p.price !== null || p.offer_price !== null))
    .reduce((min, p) => {
      const pPrice = p.offer_price !== null ? p.offer_price : p.price;
      if (pPrice === null) return min;
      return min === null ? pPrice : Math.min(min, pPrice);
    }, null as number | null);

  const priceLabel = lowestPrice !== null ? `Desde ${formatPrice(lowestPrice)}` : null;

  return (
    <Card className="group h-full overflow-hidden p-0 transition-all duration-300 hover:border-brand/50 hover:shadow-md flex flex-col">
      <div className="relative">
        <Link
          aria-label={`Ver perfil de ${business.name}`}
          href={`/businesses/${business.id}`}
        >
          <div className="aspect-[4/3] bg-surface relative overflow-hidden">
            {imageUrl ? (
              <Image
                alt={featuredProduct?.name ?? business.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                height={300}
                src={imageUrl}
                width={400}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-400">
                Imagen pendiente
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </Link>
        <FavoriteButton
          businessId={business.id}
          className="absolute right-3 top-3 shadow-sm"
          compact
        />
      </div>

      <Link className="flex-1 flex flex-col p-5" href={`/businesses/${business.id}`}>
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="uppercase text-[10px] tracking-wider text-brand bg-brand/10 hover:bg-brand/20 font-bold">
                  <Tag className="mr-1 h-3 w-3 shrink-0" />
                  {business.category?.name ?? "Categoría"}
                </Badge>
                {business.is_verified ? (
                  <Badge variant="success" className="text-[10px] tracking-wider uppercase font-bold">
                    <BadgeCheck className="mr-1 h-3 w-3" />
                    Verificado
                  </Badge>
                ) : null}
                {business.delivery_available ? (
                  <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-bold border-brand text-brand">
                    Delivery
                  </Badge>
                ) : null}
                {business.pickup_available ? (
                  <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-bold border-slate-300 text-slate-600">
                    Recojo
                  </Badge>
                ) : null}
              </div>
              <h2 className="text-lg font-bold leading-tight text-foreground group-hover:text-brand transition-colors">
                {business.name}
              </h2>
            </div>
            {hasWhatsApp ? (
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-sm border border-green-100">
                <MessageCircle className="h-5 w-5" />
              </span>
            ) : null}
          </div>
          
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground flex-1">
            {business.description}
          </p>
          
          {featuredProduct ? (
            <div className="rounded-xl border border-border bg-slate-50 p-3 mt-auto">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-semibold text-slate-700">
                  {featuredProduct.name}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    featuredProduct.is_available
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-500",
                  )}
                >
                  {featuredProduct.is_available ? "Disponible" : "Agotado"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {priceLabel ? (
                  <span className="text-base font-bold text-foreground">
                    {priceLabel}
                  </span>
                ) : null}
                {featuredProduct.stock_label ? (
                  <span className="text-xs font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                    {featuredProduct.stock_label}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-2.5 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <p className="flex items-center gap-1.5 font-medium">
                <Star className="h-4 w-4 shrink-0 text-amber-400 fill-amber-400" />
                <span className="text-slate-700">
                  {summary?.average_rating
                    ? `${summary.average_rating.toFixed(1)}`
                    : "Nuevo"}
                </span>
                <span className="text-muted-foreground">
                  {summary?.review_count ? `(${summary.review_count} op.)` : ""}
                </span>
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-[120px]" title={zone}>{zone}</span>
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
                  availabilityClassName(availability.tone),
                )}
              >
                <Clock3 className="h-3.5 w-3.5 shrink-0" />
                <span>{availability.label}</span>
              </p>
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-brand group-hover:translate-x-1 transition-transform">
                Ver perfil
                <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
