import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Image as ImageIcon,
  MapPin,
  Tag,
} from "lucide-react";

import {
  availabilityClassName,
  formatPrice,
  getBusinessAvailability,
  getProductImage,
} from "@/lib/business-display";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/layout/page-shell";
import { BusinessReviewForm } from "@/components/business/BusinessReviewForm";
import { FavoriteButton } from "@/components/business/FavoriteButton";
import { TrustSummary } from "@/components/business/TrustSummary";
import { WhatsAppContactButton } from "@/components/business/WhatsAppContactButton";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getBusinessById, getBusinessBySlug } from "@/lib/supabase/queries";
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
  const number = business.contact_info?.whatsapp_number.replace(/\D/g, "");

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

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-sm font-medium text-brand">
              <Tag className="h-4 w-4" />
              {business.category?.name ?? "Categoria"}
            </span>
            {business.is_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700">
                <BadgeCheck className="h-4 w-4" />
                Verificado por Garemo
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {business.name}
          </h1>
          <p className="text-sm leading-6 text-muted">
            {business.description}
          </p>
          <p
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              availabilityClassName(availability.tone),
            )}
          >
            <Clock className="h-4 w-4 text-brand" />
            {availability.label}
          </p>
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
                    <div className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold">
                          {product.name}
                        </h3>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                            product.is_available
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {product.is_available ? "Disponible" : "Agotado"}
                        </span>
                      </div>
                      {product.description ? (
                        <p className="line-clamp-2 text-sm leading-6 text-muted">
                          {product.description}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        {currentPrice ? (
                          <span className="text-base font-semibold">
                            {currentPrice}
                          </span>
                        ) : null}
                        {originalPrice ? (
                          <span className="text-sm text-muted line-through">
                            {originalPrice}
                          </span>
                        ) : null}
                        {product.stock_label ? (
                          <span className="rounded-full bg-brand/10 px-2 py-1 text-xs text-brand">
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

        <Card className="space-y-2 border-emerald-100 bg-emerald-50 text-emerald-950">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <BadgeCheck className="h-4 w-4" />
            Confianza
          </h2>
          <p className="text-sm leading-6">
            {business.is_verified
              ? "Vendedor verificado manualmente por Garemo para el piloto. Aun asi, confirma detalles por WhatsApp antes de pagar o coordinar entrega."
              : "Perfil aun no verificado. Contacta con cuidado y confirma datos antes de comprar."}
          </p>
        </Card>

        <BusinessReviewForm businessId={business.id} ownerId={business.owner_id} />

        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <MapPin className="h-4 w-4 text-brand" />
            Ubicacion
          </h2>
          {business.location ? (
            <div className="space-y-1 text-sm leading-6 text-muted">
              <p>{business.location.address_text}</p>
              {business.location.campus_zone ? (
                <p>{business.location.campus_zone}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted">Ubicacion por confirmar.</p>
          )}
        </Card>

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

        {whatsappUrl ? (
          <WhatsAppContactButton businessId={business.id} href={whatsappUrl} />
        ) : (
          <EmptyState
            title="Contacto no disponible"
            description="Este negocio aun no tiene un numero de WhatsApp publico."
          />
        )}
      </div>
    </PageShell>
  );
}
