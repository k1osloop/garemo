import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  Clock3,
  ImageIcon,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import {
  availabilityClassName,
  formatPrice,
  getBusinessAvailability,
  getBusinessDisplayImage,
  getFeaturedProduct,
  getFeaturedProductBadge,
} from "@/lib/business-display";
import { cn } from "@/lib/utils";
import { BusinessStatusBadge } from "@/components/business/BusinessStatusBadge";
import { FavoriteButton } from "@/components/business/FavoriteButton";
import { RatingSummary } from "@/components/business/RatingSummary";
import type { PublicBusiness } from "@/types/database";

type BusinessCardProps = {
  business: PublicBusiness;
  distanceLabel?: string;
  priorityImage?: boolean;
};

function getCompactStatusBadge(message: string | null) {
  if (!message) {
    return null;
  }

  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("revision") ||
    normalizedMessage.includes("revisión")
  ) {
    return null;
  }

  if (
    normalizedMessage.includes("promo") ||
    normalizedMessage.includes("oferta") ||
    normalizedMessage.includes("descuento")
  ) {
    return "Promo universitaria";
  }

  return "Novedad";
}

export function BusinessCard({
  business,
  distanceLabel,
  priorityImage = false,
}: BusinessCardProps) {
  const zone =
    business.location?.campus_zone ??
    business.location?.address_text ??
    "Ubicacion por confirmar";
  const hasWhatsApp = Boolean(business.contact_info?.whatsapp_number);
  const availability = getBusinessAvailability(business);
  const featuredProduct = getFeaturedProduct(business.products);
  const imageUrl = getBusinessDisplayImage(business, featuredProduct);
  const featuredProductBadge = getFeaturedProductBadge(featuredProduct);

  const featuredPrice =
    featuredProduct?.offer_price ?? featuredProduct?.price ?? null;

  const priceLabel =
    featuredPrice !== null ? `Desde ${formatPrice(featuredPrice)}` : null;
  const compactStatusBadge = getCompactStatusBadge(business.status_message);

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl sm:rounded-3xl">
      <div className="relative">
        <Link
          aria-label={`Ver perfil de ${business.name}`}
          href={`/businesses/${business.id}`}
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand/10 via-amber-50 to-slate-100">
            {imageUrl ? (
              <Image
                alt={featuredProduct?.name ?? business.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                height={360}
                priority={priorityImage}
                src={imageUrl}
                width={576}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/45 to-transparent" />
          </div>
        </Link>

        <FavoriteButton
          businessId={business.id}
          className="absolute right-3 top-3 border-white/70 bg-white/95 shadow-md"
          compact
        />

        <div className="absolute inset-x-3 bottom-3 flex min-w-0 flex-wrap gap-1.5">
          <BusinessStatusBadge business={business} />
          {business.delivery_available ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand shadow-sm">
              <Bike className="h-3.5 w-3.5" />
              Delivery
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5 sm:gap-4 sm:p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-bold uppercase tracking-wide text-brand">
                {business.category?.name ?? "Categoria"}
              </p>
              <Link href={`/businesses/${business.id}`}>
                <h2 className="mt-1 line-clamp-2 text-lg font-extrabold leading-tight text-foreground transition-colors group-hover:text-brand sm:text-xl">
                  {business.name}
                </h2>
              </Link>
            </div>
            {hasWhatsApp ? (
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MessageCircle className="h-5 w-5" />
              </span>
            ) : null}
          </div>

          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {business.description}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-border/70 bg-[#fbfaf6] p-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-bold text-foreground">
                  {featuredProduct?.name ?? "Catalogo en preparacion"}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    featuredProduct?.is_available
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {featuredProductBadge}
                </span>
              </div>
              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                {priceLabel ? (
                  <span className="text-base font-extrabold text-foreground">
                    {priceLabel}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    Consulta novedades por WhatsApp
                  </span>
                )}
                {featuredProduct?.stock_label ? (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
                    {featuredProduct.stock_label}
                  </span>
                ) : null}
                {compactStatusBadge ? (
                  <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span className="truncate">{compactStatusBadge}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3 border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <RatingSummary compact summary={business.trust_summary} />
            <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="max-w-[9rem] truncate sm:max-w-36" title={zone}>
                {distanceLabel ?? zone}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {business.pickup_available ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                <PackageCheck className="h-3.5 w-3.5" />
                Recojo en punto
              </span>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold",
                availabilityClassName(availability.tone),
              )}
            >
              <Clock3 className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{availability.label}</span>
            </span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-hover"
              href={`/businesses/${business.id}`}
            >
              Ver perfil
              <ArrowRight className="h-4 w-4" />
            </Link>
            {hasWhatsApp ? (
              <a
                aria-label={`Contactar a ${business.name} por WhatsApp`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600"
                href={`https://wa.me/${business.contact_info?.whatsapp_number?.replace(/\D/g, "")}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
