"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Eye,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { sendTransactionalEmailFromClient } from "@/lib/email/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type {
  Business,
  Category,
  ContactInfo,
  Database,
  Location,
  Product,
} from "@/types/database";

type BusinessStatus = Database["public"]["Enums"]["business_status"];

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

type RejectDialogState = {
  business: AdminBusiness;
  mode: "reject" | "needs_changes";
} | null;

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
  moderation_reason,
  moderation_status_message,
  suspended_at,
  reactivated_at,
  delivery_available,
  pickup_available,
  delivery_notes,
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

const rejectionReasons = [
  "Informacion incompleta",
  "Ubicacion incorrecta",
  "WhatsApp invalido",
  "Productos poco claros",
  "Imagenes no adecuadas",
  "Categoria incorrecta",
  "Posible incumplimiento",
  "Otro",
];

const correctionChecklist = [
  "Completar descripcion del negocio",
  "Corregir ubicacion o zona del campus",
  "Agregar WhatsApp valido",
  "Mejorar productos, precios o imagenes",
  "Revisar categoria y tipo de servicio",
];

const visibleStatuses: BusinessStatus[] = [
  "pending_review",
  "under_review",
  "rejected",
  "hidden",
  "draft",
  "active",
  "approved",
];

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

function getStatusLabel(status: BusinessStatus) {
  const labels: Record<BusinessStatus, string> = {
    active: "Activo en Garemo",
    approved: "Verificado por Garemo",
    draft: "Borrador",
    hidden: "No disponible por verificacion",
    pending_review: "Pendiente de revision",
    rejected: "Necesita correcciones",
    under_review: "En revision por reportes",
  };

  return labels[status] ?? "En revision";
}

function getStatusClassName(status: BusinessStatus) {
  if (status === "active" || status === "approved") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "pending_review" || status === "draft") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (status === "under_review") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  return "bg-red-50 text-red-700 ring-red-100";
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<RejectDialogState>(null);
  const [rejectReason, setRejectReason] = useState(rejectionReasons[0]);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectChecklist, setRejectChecklist] = useState<string[]>([]);

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
      setError(
        "No pudimos verificar tu acceso. Revisa que el SQL de moderacion este aplicado.",
      );
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
      .in("status", visibleStatuses)
      .order("created_at", { ascending: false })
      .limit(80);

    if (queueError) {
      setError(
        "No pudimos cargar negocios para revision. Puede faltar ejecutar el SQL de moderacion.",
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

  async function reviewBusiness({
    businessId,
    nextStatus,
    nextIsVerified,
    notes,
    reason,
    targetUserId,
    businessName,
    successMessage,
  }: {
    businessId: string;
    nextStatus: BusinessStatus;
    nextIsVerified: boolean;
    notes?: string | null;
    reason?: string | null;
    targetUserId?: string | null;
    businessName?: string | null;
    successMessage: string;
  }) {
    setIsReviewing(businessId);
    setError(null);
    setStatusMessage(null);

    const { error: reviewError } = await supabase.rpc("admin_review_business", {
      target_business_id: businessId,
      next_status: nextStatus,
      next_is_verified: nextIsVerified,
      notes: notes ?? null,
      reason: reason ?? null,
    });

    if (reviewError) {
      setError(
        "No pudimos guardar la revision. Solo una cuenta autorizada puede aprobar, devolver o suspender.",
      );
      setIsReviewing(null);
      return;
    }

    if (targetUserId) {
      const eventType =
        nextStatus === "approved" || nextStatus === "active"
          ? "business_approved"
          : nextStatus === "rejected"
            ? "business_needs_changes"
            : "moderation_case";

      await sendTransactionalEmailFromClient(supabase, {
        businessId,
        businessName,
        eventType,
        message: notes ?? null,
        targetUserId,
      });
    }

    setStatusMessage(successMessage);
    await loadAdminQueue();
    setIsReviewing(null);
  }

  function openRejectDialog(business: AdminBusiness) {
    setRejectDialog({ business, mode: "reject" });
    setRejectReason(rejectionReasons[0]);
    setRejectComment(notesByBusiness[business.id] ?? "");
    setRejectChecklist([]);
  }

  async function confirmReject() {
    if (!rejectDialog) {
      return;
    }

    const comment = rejectComment.trim();

    if (comment.length < 10) {
      setError("Escribe una observacion clara para que el emprendedor pueda corregir.");
      return;
    }

    const businessId = rejectDialog.business.id;
    const checklistText =
      rejectChecklist.length > 0
        ? `\n\nChecklist de correccion:\n${rejectChecklist
            .map((item) => `- ${item}`)
            .join("\n")}`
        : "";
    const notes = `${comment}${checklistText}`;

    await reviewBusiness({
      businessId,
      businessName: rejectDialog.business.name,
      nextStatus: "rejected",
      nextIsVerified: false,
      notes,
      reason: rejectReason,
      successMessage: "Verificacion devuelta y emprendedor notificado.",
      targetUserId: rejectDialog.business.owner_id,
    });

    setRejectDialog(null);
    setRejectComment("");
    setRejectChecklist([]);
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
        description="Esta ruta solo esta disponible para cuentas autorizadas."
      />
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorState title="No se pudo revisar" description={error} />
      ) : null}

      {statusMessage ? (
        <Card className="border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-800">
          {statusMessage}
        </Card>
      ) : null}

      <Card className="flex flex-col gap-4 border-brand/20 bg-brand/5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20">
              <ShieldAlert className="h-4 w-4 text-brand" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              Moderacion de negocios
            </h2>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            Aprueba, devuelve con motivo, suspende por revision o reactiva
            negocios sin eliminar datos. Cada decision importante notifica al
            emprendedor dentro de Garemo.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => void loadAdminQueue()}
          type="button"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </Card>

      {businesses.length === 0 ? (
        <EmptyState
          title="No hay negocios para revisar"
          description="Cuando un emprendedor cree o actualice su negocio, aparecera aqui para moderacion."
        />
      ) : (
        <div className="grid gap-6">
          {businesses.map((business) => {
            const isBusy = isReviewing === business.id;
            const shouldVerify = verifiedByBusiness[business.id] ?? true;
            const note = notesByBusiness[business.id] ?? "";

            return (
              <Card className="space-y-5 bg-white shadow-sm" key={business.id}>
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-black ring-1",
                          getStatusClassName(business.status),
                        )}
                      >
                        {getStatusLabel(business.status)}
                      </span>
                      <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-black text-brand">
                        {business.category?.name ?? "Sin categoria"}
                      </span>
                    </div>
                    <h3 className="break-words text-2xl font-bold text-slate-800">
                      {business.name}
                    </h3>
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                      {business.description}
                    </p>
                    {business.moderation_status_message ? (
                      <p className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                        Observacion previa: {business.moderation_status_message}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    href={`/businesses/${business.id}`}
                    target="_blank"
                  >
                    <Eye className="h-4 w-4" />
                    Ver publico
                  </Link>
                </div>

                <div className="grid gap-4 text-sm sm:grid-cols-3">
                  <InfoBox
                    label="Contacto"
                    value={business.contact_info?.whatsapp_number ?? "Sin WhatsApp"}
                  />
                  <InfoBox
                    label="Ubicacion"
                    value={business.location?.address_text ?? "Sin ubicacion"}
                  />
                  <InfoBox
                    label="Productos"
                    value={`${business.products.length} productos cargados`}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-800">
                    Nota admin
                    <textarea
                      className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                      maxLength={1000}
                      onChange={(event) =>
                        setNotesByBusiness((current) => ({
                          ...current,
                          [business.id]: event.target.value,
                        }))
                      }
                      placeholder="Explica aprobacion, correcciones, suspension o pasos pendientes."
                      value={note}
                    />
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                    <input
                      checked={shouldVerify}
                      className="h-4 w-4 rounded border-slate-300 accent-brand"
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

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Button
                      className="min-h-11 gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                      disabled={isBusy}
                      onClick={() =>
                        void reviewBusiness({
                          businessId: business.id,
                          businessName: business.name,
                          nextStatus: "approved",
                          nextIsVerified: shouldVerify,
                          notes: note || "Aprobado por revision manual de Garemo.",
                          reason: "approved",
                          successMessage: "Negocio aprobado y emprendedor notificado.",
                          targetUserId: business.owner_id,
                        })
                      }
                      type="button"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isBusy ? "Revisando..." : "Aprobar"}
                    </Button>
                    <Button
                      className="min-h-11 gap-2 border-red-200 text-red-600 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                      disabled={isBusy}
                      onClick={() => openRejectDialog(business)}
                      type="button"
                      variant="outline"
                    >
                      <XCircle className="h-4 w-4" />
                      Devolver
                    </Button>
                    <Button
                      className="min-h-11 gap-2 border-orange-200 text-orange-700 shadow-sm hover:border-orange-300 hover:bg-orange-50"
                      disabled={isBusy}
                      onClick={() =>
                        void reviewBusiness({
                          businessId: business.id,
                          businessName: business.name,
                          nextStatus: "under_review",
                          nextIsVerified: false,
                          notes:
                            note ||
                            "Tu negocio esta en revision temporal mientras verificamos reportes o informacion pendiente.",
                          reason: "admin_review",
                          successMessage: "Negocio suspendido temporalmente y emprendedor notificado.",
                          targetUserId: business.owner_id,
                        })
                      }
                      type="button"
                      variant="outline"
                    >
                      <Ban className="h-4 w-4" />
                      Suspender
                    </Button>
                    <Button
                      className="min-h-11 gap-2"
                      disabled={isBusy}
                      onClick={() =>
                        void reviewBusiness({
                          businessId: business.id,
                          businessName: business.name,
                          nextStatus: "approved",
                          nextIsVerified: shouldVerify,
                          notes: note || "Negocio reactivado por revision admin.",
                          reason: "reactivated",
                          successMessage: "Negocio reactivado y emprendedor notificado.",
                          targetUserId: business.owner_id,
                        })
                      }
                      type="button"
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reactivar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {rejectDialog ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            aria-label="Cerrar devolucion"
            className="absolute inset-0"
            onClick={() => setRejectDialog(null)}
            type="button"
          />
          <Card className="relative w-full rounded-b-none rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-600">
                  Devolver verificacion
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  {rejectDialog.business.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  El emprendedor recibira esta observacion dentro de Garemo para
                  corregir su informacion antes de una nueva revision.
                </p>
              </div>
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                Motivo principal
                <select
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  onChange={(event) => setRejectReason(event.target.value)}
                  value={rejectReason}
                >
                  {rejectionReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-2">
                <p className="text-sm font-bold text-slate-800">
                  Checklist de correcciones
                </p>
                <div className="grid gap-2">
                  {correctionChecklist.map((item) => (
                    <label
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-semibold text-slate-700"
                      key={item}
                    >
                      <input
                        checked={rejectChecklist.includes(item)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand"
                        onChange={(event) =>
                          setRejectChecklist((current) =>
                            event.target.checked
                              ? [...current, item]
                              : current.filter((selected) => selected !== item),
                          )
                        }
                        type="checkbox"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                Comentario obligatorio
                <textarea
                  className="min-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  maxLength={1000}
                  onChange={(event) => setRejectComment(event.target.value)}
                  placeholder="Explica que debe corregir el emprendedor."
                  value={rejectComment}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  className="min-h-11"
                  onClick={() => setRejectDialog(null)}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  className="min-h-11 bg-red-600 text-white hover:bg-red-700"
                  disabled={isReviewing === rejectDialog.business.id}
                  onClick={() => void confirmReject()}
                  type="button"
                >
                  Devolver y notificar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words font-medium text-slate-800">{value}</p>
    </div>
  );
}
