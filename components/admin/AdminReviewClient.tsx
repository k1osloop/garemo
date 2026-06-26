"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Business,
  Category,
  ContactInfo,
  Database,
  Location,
  Product,
} from "@/types/database";

type ReviewStatus = Extract<
  Database["public"]["Enums"]["business_status"],
  "active" | "rejected" | "hidden" | "pending_review"
>;

type AdminBusinessRow = Business & {
  category?: Category | Category[] | null;
  contact_info?: ContactInfo | ContactInfo[] | null;
  location?: Location | Location[] | null;
  products?: Product[] | null;
};

type AdminBusiness = Business & {
  category: Category | null;
  contact_info: ContactInfo | null;
  location: Location | null;
  products: Product[];
};

const adminBusinessSelect = `
  id,
  owner_id,
  category_id,
  name,
  slug,
  description,
  status,
  price_range,
  is_verified,
  status_message,
  opens_at,
  closes_at,
  reviewed_at,
  review_notes,
  created_at,
  updated_at,
  category:categories (
    id,
    name,
    slug,
    description,
    is_active,
    sort_order,
    created_at,
    updated_at
  ),
  location:locations (
    id,
    business_id,
    address_text,
    campus_zone,
    latitude,
    longitude,
    created_at,
    updated_at
  ),
  contact_info (
    id,
    business_id,
    whatsapp_number,
    instagram_url,
    facebook_url,
    website_url,
    created_at,
    updated_at
  ),
  products (
    id,
    business_id,
    name,
    description,
    price,
    offer_price,
    image_url,
    image_path,
    is_available,
    stock_label,
    created_at,
    updated_at
  )
`;

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeBusiness(row: AdminBusinessRow): AdminBusiness {
  return {
    ...row,
    category: firstOrNull(row.category),
    contact_info: firstOrNull(row.contact_info),
    location: firstOrNull(row.location),
    products: row.products ?? [],
  };
}

export function AdminReviewClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState<string | null>(null);
  const [notesByBusiness, setNotesByBusiness] = useState<
    Record<string, string>
  >({});
  const [verifiedByBusiness, setVerifiedByBusiness] = useState<
    Record<string, boolean>
  >({});

  const loadAdminQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data: userResult, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userResult.user) {
      router.replace("/login");
      return;
    }

    const { data: role, error: roleError } =
      await supabase.rpc("current_app_role");

    if (roleError) {
      setError("No pudimos verificar tu rol. Revisa que el SQL admin este aplicado.");
      setIsLoading(false);
      return;
    }

    if (role !== "admin") {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data, error: queueError } = await supabase
      .from("businesses")
      .select(adminBusinessSelect)
      .eq("status", "pending_review")
      .order("created_at", { ascending: true });

    if (queueError) {
      setError(
        "No pudimos cargar negocios pendientes. Puede faltar ejecutar el SQL de Sprint 2E.",
      );
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as AdminBusinessRow[];
    setBusinesses(rows.map(normalizeBusiness));
    setIsLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAdminQueue();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAdminQueue]);

  async function reviewBusiness(
    businessId: string,
    nextStatus: ReviewStatus,
    nextIsVerified: boolean,
  ) {
    setIsReviewing(businessId);
    setError(null);

    const { error: reviewError } = await supabase.rpc("admin_review_business", {
      target_business_id: businessId,
      next_status: nextStatus,
      next_is_verified: nextIsVerified,
      notes: notesByBusiness[businessId] ?? null,
    });

    if (reviewError) {
      setError("No pudimos guardar la revision. Solo admin activo puede aprobar o rechazar.");
      setIsReviewing(null);
      return;
    }

    await loadAdminQueue();
    setIsReviewing(null);
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando cola de revision...</p>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <ErrorState
        title="Acceso denegado"
        description="Esta ruta solo esta disponible para usuarios con rol admin activo."
      />
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorState title="No se pudo revisar" description={error} />
      ) : null}

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-brand/20 bg-brand/5 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20">
              <ShieldAlert className="h-4 w-4 text-brand" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Negocios pendientes</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 max-w-3xl">
            Revisa identidad/contacto, categoría, ubicación y productos antes de
            aprobar. Aprobar publica el negocio en directorio y mapa si tiene
            ubicación.
          </p>
        </div>
      </Card>

      {businesses.length === 0 ? (
        <EmptyState
          title="No hay negocios pendientes"
          description="Cuando un emprendedor cree su primer negocio, aparecerá aquí para revisión."
        />
      ) : (
        <div className="grid gap-6">
          {businesses.map((business) => {
            const isBusy = isReviewing === business.id;
            const shouldVerify = verifiedByBusiness[business.id] ?? true;

            return (
              <Card className="space-y-5 shadow-sm bg-white" key={business.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 inline-block px-2 py-0.5 rounded">
                      {business.category?.name ?? "Sin categoría"} • {business.status}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-800">{business.name}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 max-w-2xl">
                      {business.description}
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors px-4 shrink-0"
                    href={`/businesses/${business.id}`}
                    target="_blank"
                  >
                    Ver público
                  </Link>
                </div>

                <div className="grid gap-4 text-sm sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Contacto</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {business.contact_info?.whatsapp_number ?? "Sin WhatsApp"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ubicación</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {business.location?.address_text ?? "Sin ubicación"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Productos</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {business.products.length} productos cargados
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-800">
                    Notas de revisión
                    <textarea
                      className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all shadow-sm"
                      maxLength={1000}
                      onChange={(event) =>
                        setNotesByBusiness((current) => ({
                          ...current,
                          [business.id]: event.target.value,
                        }))
                      }
                      placeholder="Motivo de aprobación, rechazo o datos pendientes."
                      value={notesByBusiness[business.id] ?? ""}
                    />
                  </label>

                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <input
                      checked={shouldVerify}
                      className="h-4 w-4 accent-brand rounded border-slate-300"
                      onChange={(event) =>
                        setVerifiedByBusiness((current) => ({
                          ...current,
                          [business.id]: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    Marcar como verificado manualmente al aprobar
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row pt-2">
                    <Button
                      disabled={isBusy}
                      onClick={() =>
                        void reviewBusiness(business.id, "active", shouldVerify)
                      }
                      type="button"
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-h-11 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isBusy ? "Revisando..." : "Aprobar negocio"}
                    </Button>
                    <Button
                      disabled={isBusy}
                      onClick={() =>
                        void reviewBusiness(business.id, "rejected", false)
                      }
                      type="button"
                      variant="outline"
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 min-h-11 shadow-sm"
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
