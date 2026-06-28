import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bike,
  Clock,
  ImageIcon,
  MapPin,
  MessageCircle,
  PackageCheck,
  Star,
  Tag,
} from "lucide-react";

import {
  availabilityClassName,
  getBusinessAvailability,
  getBusinessCoverImage,
} from "@/lib/business-display";
import { cn } from "@/lib/utils";
import { BusinessActionButtons } from "@/components/business/BusinessActionButtons";
import { BusinessReviewForm } from "@/components/business/BusinessReviewForm";
import { BusinessStatusBadge } from "@/components/business/BusinessStatusBadge";
import { FavoriteButton } from "@/components/business/FavoriteButton";
import { ProductMenuCard } from "@/components/business/ProductMenuCard";
import { RatingSummary } from "@/components/business/RatingSummary";
import { StickyBottomBar } from "@/components/business/StickyBottomBar";
import { WhatsAppContactButton } from "@/components/business/WhatsAppContactButton";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  getBusinessById,
  getBusinessBySlug,
  getBusinessReviews,
} from "@/lib/supabase/queries";
import type { PublicBusiness, Schedule } from "@/types/database";

export const dynamic = "force-dynamic";

type BusinessDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const dayNames = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

type DisplaySchedule = Pick<
  Schedule,
  "closes_at" | "day_of_week" | "is_closed" | "opens_at"
> & {
  id?: string;
};

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function formatSchedule(schedule: DisplaySchedule) {
  if (schedule.is_closed) {
    return "Cerrado";
  }

  if (!schedule.opens_at || !schedule.closes_at) {
    return "Horario por confirmar";
  }

  return `${formatTime(schedule.opens_at)} - ${formatTime(schedule.closes_at)}`;
}

function buildScheduleFallback(business: PublicBusiness): DisplaySchedule[] {
  if (business.schedules.length > 0) {
    return business.schedules;
  }

  if (!business.opens_at || !business.closes_at) {
    return [];
  }

  return [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => ({
    closes_at: business.closes_at,
    day_of_week: dayOfWeek,
    is_closed: false,
    opens_at: business.opens_at,
  }));
}

function buildWhatsAppUrl(business: PublicBusiness) {
  const number = business.contact_info?.whatsapp_number?.replace(/\D/g, "");

  if (!number) {
    return null;
  }

  const message = encodeURIComponent(
    `Hola, vi ${business.name} en Garemo. Quiero consultar disponibilidad y precio.`,
  );

  return `https://wa.me/${number}?text=${message}`;
}

async function getVisibleBusiness(identifier: string) {
  const byId = await getBusinessById(identifier);

  if (byId.data || byId.error) {
    return byId;
  }

  return getBusinessBySlug(identifier);
}

export default async function BusinessDetailPage({
  params,
}: BusinessDetailPageProps) {
  const { id } = await params;
  const result = await getVisibleBusiness(id);
  const business = result.data;
  const reviewsResult = business
    ? await getBusinessReviews(business.id)
    : { data: [] };
  const reviews = reviewsResult.data ?? [];

  if (result.error) {
    return (
      <PageShell>
        <ErrorState
          description={result.error}
          title="No se pudo cargar el negocio"
        />
      </PageShell>
    );
  }

  if (!business) {
    return (
      <PageShell>
        <EmptyState
          description="Este negocio no existe o no esta disponible para lectura publica."
          title="Negocio no disponible"
        />
      </PageShell>
    );
  }

  const whatsappUrl = buildWhatsAppUrl(business);
  const availability = getBusinessAvailability(business);
  const coverImageUrl = getBusinessCoverImage(business);
  const sortedSchedules = buildScheduleFallback(business).sort(
    (first, second) => first.day_of_week - second.day_of_week,
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl pb-20 sm:pb-0">
        <Link
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground"
          href="/businesses"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al directorio
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-surface shadow-sm">
          <div className="relative min-h-[260px] bg-gradient-to-br from-brand/10 via-amber-50 to-slate-100 sm:min-h-[360px]">
            {coverImageUrl ? (
              <Image
                alt={`Imagen de ${business.name}`}
                className="absolute inset-0 h-full w-full object-cover"
                fill
                priority
                src={coverImageUrl}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                <ImageIcon className="h-14 w-14" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand">
                  <Tag className="h-3.5 w-3.5" />
                  {business.category?.name ?? "Categoria"}
                </span>
                <BusinessStatusBadge business={business} />
                {business.delivery_available ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand">
                    <Bike className="h-3.5 w-3.5" />
                    Delivery disponible
                  </span>
                ) : null}
                {business.pickup_available ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700">
                    <PackageCheck className="h-3.5 w-3.5" />
                    Recojo en punto
                  </span>
                ) : null}
              </div>
              <div className="max-w-3xl space-y-3">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                  {business.name}
                </h1>
                <p className="line-clamp-3 text-sm leading-6 text-white/85 sm:text-base">
                  {business.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <RatingSummary summary={business.trust_summary} />
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold",
                      availabilityClassName(availability.tone),
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    {availability.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-border/70 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#1ebe5d] sm:flex-none"
                href={whatsappUrl ?? undefined}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-5 w-5" />
                Contactar por WhatsApp
              </a>
              <FavoriteButton businessId={business.id} />
            </div>
            <BusinessActionButtons
              businessId={business.id}
              businessName={business.name}
              latitude={business.location?.latitude ?? null}
              longitude={business.location?.longitude ?? null}
            />
          </div>
        </section>

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-w-0 space-y-6">
            <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-1">
              {["Productos", "Ubicacion", "Horarios", "Opiniones"].map(
                (item) => (
                  <a
                    className="min-h-10 shrink-0 rounded-full border border-border bg-white px-4 pt-2 text-sm font-bold text-muted-foreground"
                    href={`#${item.toLowerCase()}`}
                    key={item}
                  >
                    {item}
                  </a>
                ),
              )}
            </div>

            <SectionCard
              description="Catalogo disponible para consultar por WhatsApp."
              id="productos"
              title="Productos destacados"
            >
              {business.products.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {business.products
                    .slice()
                    .sort(
                      (first, second) =>
                        Number(second.is_available) -
                        Number(first.is_available),
                    )
                    .map((product) => (
                      <ProductMenuCard key={product.id} product={product} />
                    ))}
                </div>
              ) : (
                <EmptyState
                  description="Este negocio aun no publico productos."
                  title="Catalogo pendiente"
                />
              )}
            </SectionCard>

            <SectionCard id="opiniones" title="Opiniones">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <RatingSummary summary={business.trust_summary} />
                <p className="text-sm text-muted-foreground">
                  Comentarios recientes de usuarios autenticados.
                </p>
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <article
                      className="rounded-2xl border border-border/70 bg-[#fbfaf6] p-4"
                      key={review.id}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              className={cn(
                                "h-4 w-4",
                                index < review.rating
                                  ? "fill-amber-400"
                                  : "fill-transparent text-slate-300",
                              )}
                              key={index}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          Usuario Garemo
                        </span>
                      </div>
                      {review.comment ? (
                        <p className="text-sm leading-6 text-muted-foreground">
                          {review.comment}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin calificaciones todavia.
                </p>
              )}
              <div className="mt-4">
                <BusinessReviewForm
                  businessId={business.id}
                  ownerId={business.owner_id}
                />
              </div>
            </SectionCard>
          </main>

          <aside className="min-w-0 space-y-6">
            <SectionCard id="ubicacion" title="Ubicacion">
              {business.location ? (
                <div className="space-y-4 text-sm leading-6 text-muted-foreground">
                  <div className="rounded-2xl bg-[#fbfaf6] p-4">
                    <p className="font-bold text-foreground">
                      {business.location.address_text}
                    </p>
                    {business.location.campus_zone ? (
                      <p>{business.location.campus_zone}</p>
                    ) : null}
                  </div>
                  {business.location.latitude &&
                  business.location.longitude ? (
                    <a
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-hover"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${business.location.latitude},${business.location.longitude}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <MapPin className="h-4 w-4" />
                      Como llegar
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ubicacion por confirmar.
                </p>
              )}
            </SectionCard>

            <SectionCard title="Opciones">
              <div className="flex flex-wrap gap-2">
                {business.delivery_available ? (
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                    Delivery disponible
                  </span>
                ) : null}
                {business.pickup_available ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    Recojo en punto
                  </span>
                ) : null}
              </div>
              {business.delivery_notes ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {business.delivery_notes}
                </p>
              ) : null}
            </SectionCard>

            <SectionCard id="horarios" title="Horarios">
              {sortedSchedules.length > 0 ? (
                <div className="divide-y divide-border/70">
                  {sortedSchedules.map((schedule) => (
                    <div
                      className="flex items-center justify-between gap-4 py-2 text-sm"
                      key={schedule.id ?? `fallback-${schedule.day_of_week}`}
                    >
                      <span className="font-semibold text-foreground">
                        {dayNames[schedule.day_of_week]}
                      </span>
                      <span className="text-right text-muted-foreground">
                        {formatSchedule(schedule)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Horarios por confirmar.
                </p>
              )}
            </SectionCard>
          </aside>
        </div>

        {whatsappUrl ? (
          <div className="mt-6 hidden sm:block">
            <WhatsAppContactButton businessId={business.id} href={whatsappUrl} />
          </div>
        ) : null}
      </div>

      <StickyBottomBar
        businessId={business.id}
        businessName={business.name}
        latitude={business.location?.latitude ?? null}
        longitude={business.location?.longitude ?? null}
        whatsappUrl={whatsappUrl}
      />
    </PageShell>
  );
}
