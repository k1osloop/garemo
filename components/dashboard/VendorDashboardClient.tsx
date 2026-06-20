"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  VendorBusinessForm,
  type VendorBusinessFormValues,
} from "@/components/dashboard/VendorBusinessForm";
import {
  VendorProductList,
} from "@/components/dashboard/VendorProductList";
import type { VendorProductFormValues } from "@/components/dashboard/VendorProductForm";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Business,
  BusinessImage,
  Category,
  ContactInfo,
  Location,
  Product,
  PublicBusiness,
  Schedule,
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
  const [userEmail, setUserEmail] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data: userResult, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userResult.user) {
      router.replace("/login");
      return;
    }

    setUserEmail(userResult.user.email ?? "Usuario autenticado");

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

    const rows = (data ?? []) as RelatedBusinessRow[];
    setBusiness(rows[0] ? normalizeBusiness(rows[0]) : null);
    setIsLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function saveBusiness(values: VendorBusinessFormValues) {
    if (!business) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const { error: businessError } = await supabase
      .from("businesses")
      .update({
        ...values.business,
        updated_at: new Date().toISOString(),
      })
      .eq("id", business.id);

    if (businessError) {
      setError("No pudimos guardar el negocio. RLS solo permite datos propios.");
      setIsSaving(false);
      return;
    }

    const { error: locationError } = await supabase.from("locations").upsert(
      {
        ...values.location,
        business_id: business.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" },
    );

    if (locationError) {
      setError("No pudimos guardar la ubicacion.");
      setIsSaving(false);
      return;
    }

    const { error: contactError } = await supabase
      .from("contact_info")
      .upsert(
        {
          ...values.contact,
          business_id: business.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" },
      );

    if (contactError) {
      setError("No pudimos guardar WhatsApp.");
      setIsSaving(false);
      return;
    }

    await loadDashboard();
    setIsSaving(false);
  }

  async function saveProduct(
    values: VendorProductFormValues,
    productId?: string,
  ) {
    if (!business) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      ...values,
      updated_at: new Date().toISOString(),
    };

    const { error: productError } = productId
      ? await supabase.from("products").update(payload).eq("id", productId)
      : await supabase.from("products").insert({
          ...payload,
          business_id: business.id,
        });

    if (productError) {
      setError("No pudimos guardar el producto. Solo puedes editar productos propios.");
      setIsSaving(false);
      return;
    }

    await loadDashboard();
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando panel...</p>
      </Card>
    );
  }

  return (
    <DashboardShell onSignOut={signOut} userEmail={userEmail}>
      {error ? (
        <ErrorState title="No se pudo guardar" description={error} />
      ) : null}

      {business ? (
        <div className="space-y-5">
          <Card className="space-y-2">
            <p className="text-sm font-medium text-brand">
              Estado: {business.status}
            </p>
            <p className="text-sm leading-6 text-muted">
              Tus cambios se guardan con tu sesion y RLS owner-only. El badge
              verificado sigue siendo manual y no se edita desde este panel.
            </p>
          </Card>
          <VendorBusinessForm
            business={business}
            isSaving={isSaving}
            onSave={saveBusiness}
          />
          <VendorProductList
            isSaving={isSaving}
            onSave={saveProduct}
            products={business.products}
          />
        </div>
      ) : (
        <EmptyState
          title="Aun no tienes negocio asignado"
          description="Para evitar datos peligrosos, Garemo no crea negocios automaticamente desde este panel. Pide a 2DevDogs que cree o asigne tu negocio inicial."
        />
      )}
    </DashboardShell>
  );
}
