"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  Package,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type MetricValue = number | string | null | undefined;

type TopReviewedBusiness = {
  business_id: string;
  business_name: string | null;
  review_count: number;
};

type AdminMetrics = {
  businesses?: {
    total?: MetricValue;
    public_visible?: MetricValue;
    pending?: MetricValue;
    rejected_or_reviewing?: MetricValue;
    rejected?: MetricValue;
    under_review?: MetricValue;
    suspended?: MetricValue;
    without_location?: MetricValue;
    without_products?: MetricValue;
    with_3_unique_reports?: MetricValue;
  } | null;
  products?: {
    total?: MetricValue;
    active?: MetricValue;
    inactive?: MetricValue;
    with_price?: MetricValue;
    without_price?: MetricValue;
  } | null;
  users?: {
    buyers?: MetricValue;
    owners?: MetricValue;
    admins?: MetricValue;
    onboarding_complete?: MetricValue;
    onboarding_pending?: MetricValue;
  } | null;
  reviews?: {
    total?: MetricValue;
    average_rating?: MetricValue;
    top_businesses?: TopReviewedBusiness[];
  } | null;
  reports?: {
    total?: MetricValue;
    pending?: MetricValue;
    active?: MetricValue;
    reviewing?: MetricValue;
    resolved?: MetricValue;
    dismissed?: MetricValue;
  } | null;
  quality?: {
    without_schedules?: MetricValue;
    without_whatsapp?: MetricValue;
    without_image?: MetricValue;
    without_description?: MetricValue;
    without_category?: MetricValue;
  } | null;
  notifications?: {
    total?: MetricValue;
    unread?: MetricValue;
    sent_approved?: MetricValue;
    sent_rejected?: MetricValue;
    sent_suspended?: MetricValue;
    sent_reactivated?: MetricValue;
  } | null;
};

type MetricCard = {
  label: string;
  value: MetricValue;
};

const unavailableLabel = "Dato no disponible";

function formatMetric(value: MetricValue) {
  if (value === null || value === undefined || value === "") {
    return unavailableLabel;
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("es-BO").format(value);
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return new Intl.NumberFormat("es-BO").format(numeric);
  }

  return value;
}

function MetricSection({
  cards,
  icon: Icon,
  title,
}: {
  cards: MetricCard[];
  icon: typeof BarChart3;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-black tracking-tight text-slate-800">
          {title}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const isUnavailable =
            card.value === null || card.value === undefined || card.value === "";

          return (
            <Card
              className="min-h-28 rounded-3xl border-slate-200 bg-white shadow-sm"
              key={card.label}
            >
              <p
                className={`text-2xl font-black tracking-tight ${
                  isUnavailable ? "text-slate-400" : "text-slate-900"
                }`}
              >
                {formatMetric(card.value)}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function AdminMetricsClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data: role, error: roleError } =
      await supabase.rpc("current_app_role");

    if (roleError) {
      setError("No pudimos verificar tu acceso.");
      setIsLoading(false);
      return;
    }

    if (role !== "admin") {
      setError("Esta secciÃ³n solo esta disponible para cuentas autorizadas.");
      setIsLoading(false);
      return;
    }

    const { data, error: metricsError } =
      await supabase.rpc("get_admin_metrics");

    if (metricsError) {
      setError("No pudimos cargar las mÃ©tricas. Verifica que el SQL este aplicado.");
      setIsLoading(false);
      return;
    }

    setMetrics((data ?? {}) as AdminMetrics);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMetrics();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMetrics]);

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando mÃ©tricas reales...</p>
      </Card>
    );
  }

  if (error) {
    return <ErrorState title="No se pudieron cargar mÃ©tricas" description={error} />;
  }

  const businesses = metrics?.businesses;
  const products = metrics?.products;
  const users = metrics?.users;
  const reviews = metrics?.reviews;
  const reports = metrics?.reports;
  const quality = metrics?.quality;
  const notifications = metrics?.notifications;

  return (
    <div className="space-y-7">
      <Card className="rounded-3xl border-brand/20 bg-brand/5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-brand">
              Metricas
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-800">
              Salud del marketplace
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Datos agregados para revisar crecimiento, moderacion y calidad del
            directorio sin exponer informacion sensible a usuarios publicos.
          </p>
        </div>
      </Card>

      <MetricSection
        cards={[
          { label: "Total de negocios", value: businesses?.total },
          { label: "Aprobados o activos", value: businesses?.public_visible },
          { label: "Pendientes", value: businesses?.pending },
          {
            label: "Rechazados o en revision",
            value: businesses?.rejected_or_reviewing,
          },
          { label: "Suspendidos", value: businesses?.suspended },
          { label: "Con 3+ reportes unicos", value: businesses?.with_3_unique_reports },
          { label: "Sin ubicacion", value: businesses?.without_location },
          { label: "Sin productos", value: businesses?.without_products },
        ]}
        icon={Building2}
        title="Negocios"
      />

      <MetricSection
        cards={[
          { label: "Total productos", value: products?.total },
          { label: "Productos activos", value: products?.active },
          { label: "Pausados o inactivos", value: products?.inactive },
          { label: "Con precio", value: products?.with_price },
          { label: "Sin precio", value: products?.without_price },
        ]}
        icon={Package}
        title="Productos"
      />

      <MetricSection
        cards={[
          { label: "Compradores", value: users?.buyers },
          { label: "Emprendedores", value: users?.owners },
          { label: "Administradores", value: users?.admins },
          { label: "Onboarding completo", value: users?.onboarding_complete },
          { label: "Onboarding pendiente", value: users?.onboarding_pending },
        ]}
        icon={UsersRound}
        title="Usuarios"
      />

      <MetricSection
        cards={[
          { label: "Total resenas", value: reviews?.total },
          { label: "Rating promedio", value: reviews?.average_rating },
        ]}
        icon={Star}
        title="ReseÃ±as"
      />

      {reviews?.top_businesses?.length ? (
        <section className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
            Negocios con mas resenas
          </h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {reviews.top_businesses.map((business) => (
              <Card
                className="flex items-center justify-between gap-4 rounded-3xl bg-white shadow-sm"
                key={business.business_id}
              >
                <p className="min-w-0 truncate text-sm font-bold text-slate-800">
                  {business.business_name ?? "Negocio sin nombre"}
                </p>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-black text-brand">
                  {formatMetric(business.review_count)}
                </span>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <MetricSection
        cards={[
          { label: "Total reportes", value: reports?.total },
          { label: "Pendientes", value: reports?.pending },
          { label: "Activos", value: reports?.active },
          { label: "En revision", value: reports?.reviewing },
          { label: "Resueltos", value: reports?.resolved },
          { label: "Descartados", value: reports?.dismissed },
        ]}
        icon={ClipboardList}
        title="Reportes"
      />

      <MetricSection
        cards={[
          { label: "Total notificaciones", value: notifications?.total },
          { label: "No leidas", value: notifications?.unread },
          { label: "Aprobaciones enviadas", value: notifications?.sent_approved },
          { label: "Rechazos enviados", value: notifications?.sent_rejected },
          { label: "Suspensiones enviadas", value: notifications?.sent_suspended },
          { label: "Reactivaciones enviadas", value: notifications?.sent_reactivated },
        ]}
        icon={Bell}
        title="Notificaciones"
      />

      <MetricSection
        cards={[
          { label: "Sin horarios", value: quality?.without_schedules },
          { label: "Sin WhatsApp", value: quality?.without_whatsapp },
          { label: "Sin imagen", value: quality?.without_image },
          { label: "Sin descripcion", value: quality?.without_description },
          { label: "Sin categoria", value: quality?.without_category },
        ]}
        icon={ShieldCheck}
        title="Calidad de datos"
      />
    </div>
  );
}

