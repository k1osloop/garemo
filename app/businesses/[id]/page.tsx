import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Tag,
} from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
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
    `Hola, vi ${business.name} en Garemo y quiero hacer una consulta.`,
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
  const sortedSchedules = [...business.schedules].sort(
    (first, second) => first.day_of_week - second.day_of_week,
  );

  return (
    <PageShell>
      <div className="space-y-5">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-muted"
          href="/businesses"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al directorio
        </Link>

        <div className="space-y-3">
          <p className="flex items-center gap-1 text-sm font-medium text-brand">
            <Tag className="h-4 w-4" />
            {business.category?.name ?? "Categoria"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {business.name}
          </h1>
          <p className="text-sm leading-6 text-muted">
            {business.description}
          </p>
        </div>

        <Card className="flex aspect-video items-center justify-center border-dashed text-muted">
          <div className="flex flex-col items-center gap-2 text-sm">
            <ImageIcon className="h-6 w-6" />
            Imagenes del negocio pendientes
          </div>
        </Card>

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
          <a
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-teal-800"
            href={whatsappUrl}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle className="h-4 w-4" />
            Contactar por WhatsApp
          </a>
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
