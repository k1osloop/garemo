"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Ban,
  Bell,
  CheckCheck,
  CheckCircle2,
  Circle,
  MousePointerClick,
  PackageCheck,
  ShieldCheck,
  Star,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { cn } from "@/lib/utils";
import {
  VendorBusinessForm,
  type VendorBusinessFormValues,
} from "@/components/dashboard/VendorBusinessForm";
import {
  VendorCreateBusinessForm,
  type VendorCreateBusinessFormValues,
} from "@/components/dashboard/VendorCreateBusinessForm";
import {
  VendorProductList,
} from "@/components/dashboard/VendorProductList";
import type { VendorProductFormValues } from "@/components/dashboard/VendorProductForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  ensureInitialUserProfile,
  getFullNameFromUser,
  getRequestedRoleFromUser,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildBusinessCoverPath,
  buildProductImagePath,
  uploadGaremoImage,
} from "@/lib/storage-images";
import type {
  Business,
  BusinessImage,
  BusinessTrustSummary,
  Category,
  ContactInfo,
  Location,
  Product,
  PublicBusiness,
  Schedule,
  UserNotification,
} from "@/types/database";

type RelatedBusinessRow = Business & {
  category?: Category | Category[] | null;
  contact_info?: ContactInfo | ContactInfo[] | null;
  images?: BusinessImage[] | null;
  location?: Location | Location[] | null;
  products?: Product[] | null;
  schedules?: Schedule[] | null;
};

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeBusiness(row: RelatedBusinessRow): PublicBusiness {
  return {
    ...row,
    category: firstOrNull(row.category),
    contact_info: firstOrNull(row.contact_info),
    images: row.images ?? [],
    location: firstOrNull(row.location),
    products: row.products ?? [],
    schedules: row.schedules ?? [],
    trust_summary: null,
  };
}

function normalizeTrustSummary(summary: {
  business_id: string;
  average_rating: number | string | null;
  review_count: number;
  whatsapp_click_count: number;
}): BusinessTrustSummary {
  const average =
    summary.average_rating === null ? null : Number(summary.average_rating);

  return {
    business_id: summary.business_id,
    average_rating: Number.isFinite(average) ? average : null,
    review_count: summary.review_count ?? 0,
    whatsapp_click_count: summary.whatsapp_click_count ?? 0,
  };
}

const vendorBusinessSelect = `
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
  schedules (
    id,
    business_id,
    day_of_week,
    opens_at,
    closes_at,
    is_closed,
    created_at,
    updated_at
  ),
  images:business_images (
    id,
    business_id,
    storage_path,
    public_url,
    alt_text,
    sort_order,
    created_at
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

export function VendorDashboardClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [accessState, setAccessState] = useState<
    "allowed" | "missing_profile" | "not_owner"
  >("allowed");
  const [activeTab, setActiveTab] = useState("resumen");

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    const { data: userResult, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userResult.user) {
      router.replace("/login");
      return;
    }

    setUserEmail(userResult.user.email ?? "Usuario autenticado");
    setUserId(userResult.user.id);

    const { data: role, error: roleError } =
      await supabase.rpc("current_app_role");

    if (roleError) {
      setError("No pudimos verificar tu rol de cuenta.");
      setIsLoading(false);
      return;
    }

    let resolvedRole = role;

    if (!resolvedRole) {
      const requestedRole = getRequestedRoleFromUser(userResult.user);

      if (requestedRole) {
        const { data: createdProfile } = await ensureInitialUserProfile(
          supabase,
          requestedRole,
          getFullNameFromUser(userResult.user),
        );

        resolvedRole = createdProfile?.role ?? null;
      }
    }

    if (!resolvedRole) {
      setAccessState("missing_profile");
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    if (resolvedRole !== "owner") {
      setAccessState("not_owner");
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setAccessState("allowed");

    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select(
        "id, name, slug, description, is_active, sort_order, created_at, updated_at",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (categoryError) {
      setError("No pudimos cargar categorias para el panel.");
      setIsLoading(false);
      return;
    }

    setCategories((categoryData ?? []) as Category[]);

    const { data, error: businessError } = await supabase
      .from("businesses")
      .select(vendorBusinessSelect)
      .eq("owner_id", userResult.user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (businessError) {
      setError("No pudimos cargar tus datos. Revisa tu sesion o permisos.");
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as RelatedBusinessRow[];
    const normalizedBusiness = rows[0] ? normalizeBusiness(rows[0]) : null;

    const { data: notificationData } = await supabase
      .from("user_notifications")
      .select(
        "id, user_id, business_id, type, title, message, status, metadata, created_at, read_at",
      )
      .eq("user_id", userResult.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setNotifications((notificationData ?? []) as UserNotification[]);

    if (normalizedBusiness) {
      const { data: trustData } = await supabase.rpc(
        "get_public_business_trust_summaries",
      );
      const summary = (trustData ?? [])
        .map(normalizeTrustSummary)
        .find((item) => item.business_id === normalizedBusiness.id);

      setBusiness({
        ...normalizedBusiness,
        trust_summary: summary ?? null,
      });
    } else {
      setBusiness(null);
    }
    setIsLoading(false);
  }, [router, supabase]);

  async function markNotificationRead(notificationId: string) {
    const { error: markError } = await supabase.rpc("mark_notification_read", {
      notification_id: notificationId,
    });

    if (markError) {
      setError("No pudimos marcar la notificacion como leida.");
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              status: "read",
              read_at: notification.read_at ?? new Date().toISOString(),
            }
          : notification,
      ),
    );
  }

  async function markAllNotificationsRead() {
    const { error: markError } = await supabase.rpc(
      "mark_all_my_notifications_read",
    );

    if (markError) {
      setError("No pudimos marcar tus notificaciones como leidas.");
      return;
    }

    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        status: "read",
        read_at: notification.read_at ?? readAt,
      })),
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("No pudimos cerrar sesion. Intenta de nuevo.");
      return;
    }

    router.replace("/login");
  }

  async function saveBusiness(values: VendorBusinessFormValues) {
    if (!business || !userId) {
      return false;
    }

    if (business.owner_id !== userId) {
      console.error("Dashboard ownership mismatch before business update", {
        table: "businesses",
        operation: "update",
        authUserId: userId,
        businessId: business.id,
        businessOwnerId: business.owner_id,
      });
      setError(
        "Este negocio no pertenece a tu cuenta. Crea tu propio negocio o inicia sesion con la cuenta correcta.",
      );
      return false;
    }

    setIsSaving(true);
    setError(null);

    const businessPayload = {
      name: values.business.name,
      description: values.business.description,
      price_range: values.business.price_range,
      status_message: values.business.status_message,
      opens_at: values.business.opens_at,
      closes_at: values.business.closes_at,
      delivery_available: values.business.delivery_available,
      pickup_available: values.business.pickup_available,
      delivery_notes: values.business.delivery_notes,
    };

    const { data: updatedBusiness, error: businessError } = await supabase
      .from("businesses")
      .update(businessPayload)
      .eq("id", business.id)
      .eq("owner_id", userId)
      .select("id, owner_id")
      .maybeSingle();

    if (businessError || !updatedBusiness) {
      console.error("Supabase business update failed", {
        table: "businesses",
        operation: "update",
        authUserId: userId,
        businessId: business.id,
        businessOwnerId: business.owner_id,
        payload: businessPayload,
        error: businessError,
      });
      setError(
        "No pudimos guardar este negocio. Verifica que estes usando la cuenta correcta.",
      );
      setIsSaving(false);
      return false;
    }

    if (business.location) {
      const { error: locationError } = await supabase
        .from("locations")
        .update(values.location)
        .eq("business_id", business.id);

      if (locationError) {
        console.error("Supabase location update failed", {
          table: "locations",
          operation: "update",
          authUserId: userId,
          businessId: business.id,
          businessOwnerId: business.owner_id,
          payload: values.location,
          error: locationError,
        });
        setError("No pudimos guardar la ubicacion. Verifica tu cuenta e intenta de nuevo.");
        setIsSaving(false);
        return false;
      }
    } else {
      const { error: locationError } = await supabase
        .from("locations")
        .insert({
          ...values.location,
          business_id: business.id,
        });

      if (locationError) {
        console.error("Supabase location insert failed", {
          table: "locations",
          operation: "insert",
          authUserId: userId,
          businessId: business.id,
          businessOwnerId: business.owner_id,
          payload: values.location,
          error: locationError,
        });
        setError("No pudimos guardar la ubicacion. Verifica tu cuenta e intenta de nuevo.");
        setIsSaving(false);
        return false;
      }
    }

    if (business.contact_info) {
      const { error: contactError } = await supabase
        .from("contact_info")
        .update(values.contact)
        .eq("business_id", business.id);

      if (contactError) {
        console.error("Supabase contact_info update failed", {
          table: "contact_info",
          operation: "update",
          authUserId: userId,
          businessId: business.id,
          businessOwnerId: business.owner_id,
          payload: values.contact,
          error: contactError,
        });
        setError("No pudimos guardar WhatsApp. Verifica tu cuenta e intenta de nuevo.");
        setIsSaving(false);
        return false;
      }
    } else {
      const { error: contactError } = await supabase
        .from("contact_info")
        .insert({
          ...values.contact,
          business_id: business.id,
        });

      if (contactError) {
        console.error("Supabase contact_info insert failed", {
          table: "contact_info",
          operation: "insert",
          authUserId: userId,
          businessId: business.id,
          businessOwnerId: business.owner_id,
          payload: values.contact,
          error: contactError,
        });
        setError("No pudimos guardar WhatsApp. Verifica tu cuenta e intenta de nuevo.");
        setIsSaving(false);
        return false;
      }
    }

    const schedulePayload = values.schedules
      .filter(
        (schedule) =>
          schedule.is_closed || (schedule.opens_at && schedule.closes_at),
      )
      .map((schedule) => ({
        business_id: business.id,
        day_of_week: schedule.day_of_week,
        opens_at: schedule.is_closed ? null : schedule.opens_at,
        closes_at: schedule.is_closed ? null : schedule.closes_at,
        is_closed: schedule.is_closed,
        updated_at: new Date().toISOString(),
      }));

    if (schedulePayload.length > 0) {
      const { error: schedulesError } = await supabase
        .from("schedules")
        .upsert(schedulePayload, {
          onConflict: "business_id,day_of_week",
        });

      if (schedulesError) {
        console.error("Supabase schedules upsert failed", {
          table: "schedules",
          operation: "upsert",
          authUserId: userId,
          businessId: business.id,
          businessOwnerId: business.owner_id,
          payload: schedulePayload,
          error: schedulesError,
        });
        setError("No pudimos guardar los horarios. Verifica tu cuenta e intenta de nuevo.");
        setIsSaving(false);
        return false;
      }
    }

    await loadDashboard(false);
    setIsSaving(false);
    return true;
  }

  async function createBusiness(values: VendorCreateBusinessFormValues) {
    if (!userId) {
      setError("No pudimos confirmar tu usuario autenticado.");
      return false;
    }

    setIsSaving(true);
    setError(null);

    const { data: createdBusiness, error: businessError } = await supabase
      .from("businesses")
      .insert({
        owner_id: userId,
        category_id: values.business.category_id,
        name: values.business.name,
        slug: createBusinessSlug(values.business.name),
        description: values.business.description,
        status: "pending_review",
        status_message: values.business.status_message,
        opens_at: values.business.opens_at,
        closes_at: values.business.closes_at,
      })
      .select("id")
      .single();

    if (businessError || !createdBusiness) {
      setError(
        "No pudimos crear el negocio. Debes tener una cuenta emprendedora activa y solo puedes crear negocios para tu propia cuenta.",
      );
      setIsSaving(false);
      return false;
    }

    const { error: locationError } = await supabase.from("locations").insert({
      ...values.location,
      business_id: createdBusiness.id,
    });

    if (locationError) {
      setError(
        "El negocio fue creado como pendiente, pero no pudimos guardar la ubicacion. Intenta completarla desde el panel.",
      );
      await loadDashboard();
      setIsSaving(false);
      return false;
    }

    const { error: contactError } = await supabase
      .from("contact_info")
      .insert({
        ...values.contact,
        business_id: createdBusiness.id,
      });

    if (contactError) {
      setError(
        "El negocio fue creado como pendiente, pero no pudimos guardar WhatsApp. Intenta completarlo desde el panel.",
      );
      await loadDashboard();
      setIsSaving(false);
      return false;
    }

    await loadDashboard(false);
    setIsSaving(false);
    return true;
  }

  async function saveProduct(
    values: VendorProductFormValues,
    productId?: string,
  ) {
    if (!business) {
      return false;
    }

    setIsSaving(true);
    setError(null);

    const { image_file, ...productValues } = values;

    let targetProductId = productId;

    if (productId) {
      const payload = {
        ...productValues,
        updated_at: new Date().toISOString(),
      };
      const { error: productError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId)
        .eq("business_id", business.id);
        
      if (productError) {
        setError("No pudimos guardar el producto. Solo puedes editar productos propios.");
        setIsSaving(false);
        return false;
      }
    } else {
      const insertPayload = {
        business_id: business.id,
        name: productValues.name,
        description: productValues.description,
        price: productValues.price,
        offer_price: productValues.offer_price,
        stock_label: productValues.stock_label,
        is_available: productValues.is_available,
      };

      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert(insertPayload)
        .select("id")
        .single();

      if (productError || !newProduct) {
        setError("No pudimos crear el producto.");
        setIsSaving(false);
        return false;
      }
      targetProductId = newProduct.id;
    }

    if (image_file && targetProductId) {
      try {
        // uploadProductImage handles uploading and updating the product row
        await uploadProductImage(targetProductId, image_file);
      } catch {
        setError("El producto se guardÃ³, pero hubo un error al subir la imagen.");
        await loadDashboard(false);
        setIsSaving(false);
        return false;
      }
    }

    await loadDashboard(false);
    setIsSaving(false);
    return true;
  }

  async function deleteProduct(productId: string) {
    if (!business) return;
    setIsSaving(true);
    setError(null);
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("business_id", business.id);

    if (error) {
      setError("No se pudo eliminar el producto. Si ya estÃ¡ en uso, te recomendamos pausarlo en lugar de eliminarlo.");
    }
    await loadDashboard(false);
    setIsSaving(false);
  }

  async function uploadBusinessCover(file: File) {
    if (!business || !userId) {
      throw new Error("No pudimos confirmar tu negocio.");
    }

    const path = buildBusinessCoverPath(userId, business.id, file);
    const uploaded = await uploadGaremoImage(supabase, path, file);

    const { error: imageError } = await supabase
      .from("business_images")
      .insert({
        business_id: business.id,
        storage_path: uploaded.path,
        public_url: uploaded.publicUrl,
        alt_text: `Imagen de ${business.name}`,
        sort_order: 0,
      });

    if (imageError) {
      await supabase.storage.from("garemo-images").remove([uploaded.path]);
      throw new Error("La imagen subiÃ³, pero no pudimos guardar metadata.");
    }

    await loadDashboard(false);
    return uploaded.publicUrl;
  }

  async function uploadProductImage(productId: string, file: File) {
    if (!business || !userId) {
      throw new Error("No pudimos confirmar tu negocio.");
    }

    const path = buildProductImagePath(userId, business.id, productId, file);
    const uploaded = await uploadGaremoImage(supabase, path, file);

    const { error: productError } = await supabase
      .from("products")
      .update({
        image_path: uploaded.path,
        image_url: uploaded.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("business_id", business.id);

    if (productError) {
      await supabase.storage.from("garemo-images").remove([uploaded.path]);
      throw new Error("La imagen subiÃ³, pero no pudimos guardar el producto.");
    }

    await loadDashboard(false);
    return uploaded.publicUrl;
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando panel...</p>
      </Card>
    );
  }

  return (
    <DashboardShell
      onSignOut={signOut}
      subtitle={accessState === "allowed" ? "Panel emprendedor" : "Cuenta Garemo"}
      title={accessState === "allowed" ? "Gestiona tu negocio" : "Acceso al panel"}
      userEmail={userEmail}
    >
      {error ? (
        <ErrorState title="No se pudo guardar" description={error} />
      ) : null}

      {accessState === "missing_profile" ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Completa tu perfil primero</h2>
          <p className="text-sm leading-6 text-muted">
            Tu cuenta de Auth existe, pero aun no tiene perfil Garemo activo.
            Crea una cuenta pÃºblica como comprador o emprendedor para activar un
            perfil sin permisos especiales.
          </p>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-teal-800"
            href="/signup"
          >
            Crear perfil
          </Link>
        </Card>
      ) : null}

      {accessState === "not_owner" ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Panel solo para emprendedores</h2>
          <p className="text-sm leading-6 text-muted">
            Esta cuenta no tiene rol emprendedor. Puedes usar Garemo como
            comprador desde tu cuenta, guardar favoritos y calificar negocios.
          </p>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-teal-800"
            href="/account"
          >
            Ir a mi cuenta
          </Link>
        </Card>
      ) : null}

      {accessState !== "allowed" ? null : business ? (
        <div className="space-y-6">
          <BusinessModerationAlert
            business={business}
            onEdit={() => setActiveTab("perfil")}
          />
          <DashboardNotificationsSummary
            notifications={notifications}
            onMarkAllRead={markAllNotificationsRead}
            onMarkRead={markNotificationRead}
          />

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <aside className="lg:w-64 shrink-0">
              <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide lg:sticky lg:top-24">
                {[
                  { id: "resumen", label: "Resumen" },
                  { id: "perfil", label: "Perfil del negocio" },
                  { id: "ubicacion", label: "UbicaciÃ³n y horarios" },
                  { id: "productos", label: "Productos" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 text-left",
                      activeTab === tab.id
                        ? "bg-brand text-brand-foreground shadow-sm"
                        : "bg-surface text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
                
                <a
                  href={`/businesses/${business.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-left flex items-center justify-between mt-0 lg:mt-4"
                >
                  Vista previa
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </nav>
            </aside>

            {/* Content Area */}
            <main className="flex-1 min-w-0 pb-12">
              <div className={cn("space-y-5", activeTab !== "resumen" && "hidden")}>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    icon={PackageCheck}
                    label="Productos activos"
                    value={business.products.filter((product) => product.is_available).length}
                  />
                  <MetricCard
                    icon={BarChart3}
                    label="Productos pausados"
                    value={business.products.filter((product) => !product.is_available).length}
                  />
                  <MetricCard
                    icon={Star}
                    label="Rating promedio"
                    value={
                      business.trust_summary?.average_rating !== null &&
                      business.trust_summary?.average_rating !== undefined
                        ? business.trust_summary.average_rating.toFixed(1)
                        : "Nuevo"
                    }
                    detail={`${business.trust_summary?.review_count ?? 0} resenas`}
                  />
                  <MetricCard
                    icon={MousePointerClick}
                    label="Clics WhatsApp"
                    value={business.trust_summary?.whatsapp_click_count ?? 0}
                  />
                </div>

                <Card className="grid gap-6 lg:grid-cols-2 shadow-sm border-slate-200">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <ShieldCheck className="h-6 w-6 text-brand" />
                      <div>
                        <h2 className="text-sm font-medium uppercase text-muted-foreground tracking-wider">Estado Actual</h2>
                        <p className="text-base font-bold text-slate-800">
                          {getDashboardStatusLabel(business.status)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {getDashboardStatusDescription(business.status)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-slate-50 p-4">
                    <h3 className="text-sm font-bold text-slate-800">Progreso del perfil</h3>
                    <ul className="mt-4 space-y-3 text-sm">
                      {getProfileChecklist(business).map((item) => (
                        <li className="flex items-start gap-3" key={item.label}>
                          {item.done ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className={item.done ? "text-slate-700 font-medium" : "text-muted-foreground"}>
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>

              <VendorBusinessForm
                business={business}
                isSaving={isSaving}
                onCoverUpload={uploadBusinessCover}
                onSave={saveBusiness}
                activeTab={activeTab}
              />
              
              <div className={cn(activeTab !== "productos" && "hidden")}>
                <VendorProductList
                  businessId={business.id}
                  businessStatus={business.status}
                  isSaving={isSaving}
                  onImageUpload={uploadProductImage}
                  onSave={saveProduct}
                  onDelete={deleteProduct}
                  products={business.products}
                />
              </div>
            </main>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <EmptyState
            title="Crea tu negocio"
            description="Puedes crear tu primer negocio desde este panel. NacerÃ¡ como pendiente de revisiÃ³n y podrÃ¡s aÃ±adir fotos, productos y delivery una vez guardes los datos bÃ¡sicos."
          />
          <VendorCreateBusinessForm
            categories={categories}
            isSaving={isSaving}
            onCreate={createBusiness}
          />
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">Revision manual</h2>
            <p className="text-sm leading-6 text-muted">
              El negocio quedara asignado a {userEmail} y solo podras editar
              tus propios datos. La verificacion, el estado publico y la
              aprobacion siguen a cargo de la administracion de Garemo.
            </p>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

function createBusinessSlug(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const suffix = Date.now().toString(36).slice(-6);

  return `${base || "negocio"}-${suffix}`;
}

function getDashboardStatusLabel(status: PublicBusiness["status"]) {
  const labels: Record<PublicBusiness["status"], string> = {
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

function getDashboardStatusDescription(status: PublicBusiness["status"]) {
  if (status === "active" || status === "approved") {
    return "Tu negocio esta aprobado. Tus productos visibles pueden encontrarse en el directorio y mapa de Garemo.";
  }

  if (status === "pending_review" || status === "draft") {
    return "Tus datos estan guardados. Garemo revisara tu negocio antes de mostrarlo como verificado.";
  }

  if (status === "under_review") {
    return "Tu negocio esta suspendido temporalmente mientras el administrador revisa reportes o informacion pendiente.";
  }

  return "Tu negocio necesita correcciones antes de volver a estar visible en Garemo.";
}

function BusinessModerationAlert({
  business,
  onEdit,
}: {
  business: PublicBusiness;
  onEdit: () => void;
}) {
  if (business.status === "active" || business.status === "approved") {
    return (
      <Card className="flex flex-col gap-3 border-emerald-200 bg-emerald-50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h2 className="font-black text-emerald-900">Activo en Garemo</h2>
            <p className="text-sm leading-6 text-emerald-800">
              Tu emprendimiento ya puede aparecer en el directorio y mapa si tiene datos publicos completos.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (business.status === "pending_review" || business.status === "draft") {
    return (
      <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h2 className="font-black text-amber-900">Pendiente de revision</h2>
            <p className="text-sm leading-6 text-amber-800">
              Puedes seguir completando informacion mientras Garemo revisa tu negocio.
            </p>
          </div>
        </div>
        <Button onClick={onEdit} type="button" variant="outline">
          Editar informacion
        </Button>
      </Card>
    );
  }

  if (business.status === "under_review") {
    return (
      <Card className="flex flex-col gap-3 border-orange-200 bg-orange-50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-orange-700" />
          <div>
            <h2 className="font-black text-orange-950">Tu negocio esta en revision</h2>
            <p className="text-sm leading-6 text-orange-900">
              {business.moderation_status_message ??
                "Recibimos reportes de la comunidad y el negocio fue suspendido temporalmente mientras se revisa."}
            </p>
          </div>
        </div>
        <Button onClick={onEdit} type="button" variant="outline">
          Ver observaciones
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3 border-red-200 bg-red-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div>
          <h2 className="font-black text-red-950">Tu negocio necesita correcciones</h2>
          <p className="text-sm leading-6 text-red-900">
            {business.moderation_status_message ??
              business.review_notes ??
              "El administrador encontro observaciones. Corrige tu informacion y vuelve a solicitar revision."}
          </p>
        </div>
      </div>
      <Button onClick={onEdit} type="button" variant="outline">
        Editar informacion
      </Button>
    </Card>
  );
}

function DashboardNotificationsSummary({
  notifications,
  onMarkAllRead,
  onMarkRead,
}: {
  notifications: UserNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (notificationId: string) => void;
}) {
  const unreadCount = notifications.filter(
    (notification) => notification.status === "unread",
  ).length;

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-4 border-brand/15 bg-white shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-black text-slate-900">Notificaciones del negocio</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} aviso${unreadCount === 1 ? "" : "s"} sin leer sobre tu negocio o reportes.`
                : "Tus avisos importantes estan al dia."}
            </p>
          </div>
        </div>
        {unreadCount > 0 ? (
          <Button
            className="gap-2 rounded-2xl"
            onClick={onMarkAllRead}
            type="button"
            variant="outline"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todo como leido
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3">
        {notifications.slice(0, 3).map((notification) => (
          <article
            className={cn(
              "rounded-2xl border p-4",
              notification.status === "unread"
                ? "border-brand/20 bg-brand/5"
                : "border-slate-100 bg-slate-50",
            )}
            key={notification.id}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-slate-800">
                    {notification.title}
                  </h3>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                      notification.status === "unread"
                        ? "bg-brand text-brand-foreground"
                        : "bg-slate-200 text-slate-600",
                    )}
                  >
                    {notification.status === "unread" ? "Nueva" : "Leida"}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs font-semibold text-slate-400">
                  {new Date(notification.created_at).toLocaleDateString("es-BO")}
                </p>
              </div>
              {notification.status === "unread" ? (
                <Button
                  className="shrink-0"
                  onClick={() => onMarkRead(notification.id)}
                  type="button"
                  variant="outline"
                >
                  Marcar leida
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail?: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="flex items-center gap-3 border-slate-200 bg-white shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-black text-foreground">{value}</p>
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>
    </Card>
  );
}

function getProfileChecklist(business: PublicBusiness) {
  return [
    {
      label: "Nombre y descripcion listos",
      done: Boolean(business.name && business.description.length >= 12),
    },
    {
      label: "WhatsApp de contacto agregado",
      done: Boolean(business.contact_info?.whatsapp_number),
    },
    {
      label: "Ubicacion o referencia visible",
      done: Boolean(business.location?.address_text),
    },
    {
      label: "Horario basico configurado",
      done: Boolean(business.opens_at && business.closes_at),
    },
    {
      label: "Al menos un producto visible",
      done: business.products.some((product) => product.is_available),
    },
  ];
}
