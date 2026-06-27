import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Image as ImageIcon,
  MapPin,
  Star,
  Tag,
} from "lucide-react";

import {
  availabilityClassName,
  formatPrice,
  getBusinessAvailability,
  getBusinessCoverImage,
  getProductImage,
} from "@/lib/business-display";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/layout/page-shell";
import { BusinessReviewForm } from "@/components/business/BusinessReviewForm";
import { FavoriteButton } from "@/components/business/FavoriteButton";
import { TrustSummary } from "@/components/business/TrustSummary";
import { WhatsAppContactButton } from "@/components/business/WhatsAppContactButton";
import { BusinessActionButtons } from "@/components/business/BusinessActionButtons";
import { StickyBottomBar } from "@/components/business/StickyBottomBar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getBusinessById, getBusinessBySlug, getBusinessReviews } from "@/lib/supabase/queries";
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

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function formatSchedule(schedule: Schedule) {
  if (schedule.is_closed) {
    return "Cerrado";
  }

  if (!schedule.opens_at || !schedule.closes_at) {
    return "Horario por confirmar";
  }

  return `${formatTime(schedule.opens_at)} - ${formatTime(schedule.closes_at)}`;
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
  
  const reviewsResult = business ? await getBusinessReviews(business.id) : { data: [] };
  const reviews = reviewsResult.data ?? [];

  if (result.error) {
    return (
      <PageShell>
        <ErrorState
          title="No se pudo cargar el negocio"
          description={result.error}
        />
      </PageShell>
    );
  }

  if (!business) {
    return (
      <PageShell>
        <EmptyState
          title="Negocio no disponible"
          description="Este negocio no existe, no esta activo o aun no fue aprobado para lectura publica."
        />
      </PageShell>
    );
  }

  const whatsappUrl = buildWhatsAppUrl(business);
  const availability = getBusinessAvailability(business);
  const coverImageUrl = getBusinessCoverImage(business);
  const sortedSchedules = [...business.schedules].sort(
    (first, second) => first.day_of_week - second.day_of_week,
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-muted"
          href="/businesses"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al directorio
        </Link>

        {coverImageUrl ? (
          <div className="overflow-hidden rounded-lg border border-border bg-surface -mx-4 sm:mx-0">
            <Image
              alt={`Imagen de ${business.name}`}
              className="aspect-[16/10] sm:aspect-auto sm:h-64 h-full w-full object-cover"
              height={500}
              src={coverImageUrl}
              width={800}
            />
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-sm font-medium text-brand">
              <Tag className="h-4 w-4" />
              {business.category?.name ?? "Categoria"}
            </span>
            {business.status === 'approved' || business.status === 'active' || business.is_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700">
                <BadgeCheck className="h-4 w-4" />
                Verificado por Garemo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-700 border border-amber-200">
                <BadgeCheck className="h-4 w-4 text-amber-600" />
                Sin verificar
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {business.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {business.description}
              </p>
              <p
                className={cn(
                  "mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm",
                  availabilityClassName(availability.tone),
                )}
              >
                <Clock className="h-4 w-4 text-brand" />
                {availability.label}
              </p>
            </div>
            
            <BusinessActionButtons 
              businessName={business.name}
              latitude={business.location?.latitude ?? null}
              longitude={business.location?.longitude ?? null}
            />
          </div>
        </div>

        <TrustSummary business={business} />

        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Guardar negocio</h2>
            <p className="text-sm leading-6 text-muted">
              Guarda este negocio en tu cuenta para volver rapido despues.
              Garemo no usa favoritos como ranking publico en este piloto.
            </p>
          </div>
          <FavoriteButton businessId={business.id} />
        </Card>

        {business.products.length > 0 ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Productos destacados</h2>
              <p className="text-sm leading-6 text-muted">
                Datos DEV/manuales para validar busqueda, precio y confianza.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {business.products
                .slice()
                .sort((first, second) =>
                  Number(second.is_available) - Number(first.is_available),
                )
                .map((product) => {
                const imageUrl = getProductImage(product);
                const currentPrice = formatPrice(
                  product.offer_price ?? product.price,
                );
                const originalPrice =
                  product.offer_price && product.price
                    ? formatPrice(product.price)
                    : null;

                return (
                  <Card className="overflow-hidden p-0" key={product.id}>
                    <div className="aspect-[4/3] bg-surface">
                      {imageUrl ? (
                        <Image
                          alt={product.name}
                          className="h-full w-full object-cover"
                          height={300}
                          src={imageUrl}
                          width={400}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted">
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Imagen pendiente
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {product.name}
                        </h3>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            product.is_available
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-200 text-slate-500",
                          )}
                        >
                          {product.is_available ? "Disponible" : "Agotado"}
                        </span>
                      </div>
                      {product.description ? (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground mb-3 flex-1">
                          {product.description}
                        </p>
                      ) : <div className="flex-1" />}
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                        {currentPrice ? (
                          <span className="text-base font-bold text-foreground">
                            {currentPrice}
                          </span>
                        ) : null}
                        {originalPrice ? (
                          <span className="text-sm text-muted-foreground line-through">
                            {originalPrice}
                          </span>
                        ) : null}
                        {product.stock_label ? (
                          <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                            {product.stock_label}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ) : (
          <Card className="flex aspect-video items-center justify-center border-dashed text-muted">
            <div className="flex flex-col items-center gap-2 text-sm">
              <ImageIcon className="h-6 w-6" />
              Productos e imagenes pendientes
            </div>
          </Card>
        )}

        <Card className={cn("space-y-2", business.status === 'approved' || business.is_verified ? "border-emerald-100 bg-emerald-50 text-emerald-950" : "border-amber-100 bg-amber-50 text-amber-950")}>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <BadgeCheck className="h-4 w-4" />
            Confianza
          </h2>
          <p className="text-sm leading-6">
            {business.status === 'approved' || business.is_verified
              ? "Emprendedor verificado manualmente por Garemo. Aún así, confirma detalles por WhatsApp antes de pagar o coordinar entrega."
              : "Garemo aún no revisó este negocio. Compra con criterio y reporta cualquier problema."}
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4 text-brand" />
              Ubicacion
            </h2>
            {business.location ? (
              <div className="space-y-3 text-sm leading-6 text-muted">
                <div className="space-y-1">
                  <p>{business.location.address_text}</p>
                  {business.location.campus_zone ? (
                    <p>{business.location.campus_zone}</p>
                  ) : null}
                </div>
                {business.location.latitude && business.location.longitude ? (
                  <a
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${business.location.latitude},${business.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4" />
                    Cómo llegar
                  </a>
                ) : (
                  <p className="text-xs italic text-muted-foreground mt-2">Ubicación exacta no disponible</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Ubicacion por confirmar.</p>
            )}
          </Card>

          <Card className="space-y-3 border-l-4 border-l-brand">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              Opciones de entrega
            </h2>
            <div className="space-y-2">
              {!business.delivery_available && !business.pickup_available && !business.delivery_notes ? (
                <span className="text-sm text-muted">Opciones de entrega por confirmar.</span>
              ) : (
                <>
                  <div className="flex gap-2">
                    {business.delivery_available ? (
                      <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-1 text-xs font-medium text-brand">Delivery disponible</span>
                    ) : null}
                    {business.pickup_available ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Recojo en punto</span>
                    ) : null}
                  </div>
                  {business.delivery_notes ? (
                    <p className="text-sm leading-6 text-muted italic">&quot;{business.delivery_notes}&quot;</p>
                  ) : null}
                </>
              )}
            </div>
          </Card>
        </div>

        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-brand" />
            Horarios
          </h2>
          {sortedSchedules.length > 0 ? (
            <div className="divide-y divide-border">
              {sortedSchedules.map((schedule) => (
                <div
                  className="flex items-center justify-between gap-4 py-2 text-sm"
                  key={schedule.id}
                >
                  <span>{dayNames[schedule.day_of_week]}</span>
                  <span className="text-right text-muted">
                    {formatSchedule(schedule)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Horarios por confirmar.</p>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold">Comentarios recientes</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4 divide-y divide-border">
              {reviews.map((review) => (
                <div key={review.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-amber-400" : "fill-transparent text-slate-300")} />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      Usuario Garemo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Aún no hay opiniones. Sé el primero en calificar.</p>
          )}
        </Card>

        <BusinessReviewForm businessId={business.id} ownerId={business.owner_id} />

        {whatsappUrl ? (
          <WhatsAppContactButton businessId={business.id} href={whatsappUrl} />
        ) : (
          <EmptyState
            title="Contacto no disponible"
            description="Este negocio aun no tiene un numero de WhatsApp publico."
          />
        )}
      </div>

      <StickyBottomBar 
        businessId={business.id}
        businessName={business.name}
        whatsappUrl={whatsappUrl}
        latitude={business.location?.latitude ?? null}
        longitude={business.location?.longitude ?? null}
      />
    </PageShell>
  );
}
