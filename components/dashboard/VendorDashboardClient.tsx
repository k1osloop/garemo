"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
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
    trust_summary: null,
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
  const [accessState, setAccessState] = useState<
    "allowed" | "missing_profile" | "not_owner"
  >("allowed");

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
      setIsLoading(false);
      return;
    }

    if (resolvedRole !== "owner") {
      setAccessState("not_owner");
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
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("No pudimos cerrar sesion. Intenta de nuevo.");
      return;
    }

    router.replace("/login");
  }

  async function saveBusiness(values: VendorBusinessFormValues) {
    if (!business) {
      return false;
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
      return false;
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
      return false;
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
      return false;
    }

    await loadDashboard();
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
        "No pudimos crear el negocio. Debes tener perfil owner activo y RLS solo permite crear negocios propios.",
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

    await loadDashboard();
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
      return false;
    }

    await loadDashboard();
    setIsSaving(false);
    return true;
  }

  async function uploadBusinessCover(file: File) {
    if (!business) {
      throw new Error("No pudimos confirmar tu negocio.");
    }

    const path = buildBusinessCoverPath(business.id, file);
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
      throw new Error("La imagen subio, pero no pudimos guardar metadata.");
    }

    await loadDashboard();
    return uploaded.publicUrl;
  }

  async function uploadProductImage(productId: string, file: File) {
    if (!business) {
      throw new Error("No pudimos confirmar tu negocio.");
    }

    const productBelongsToBusiness = business.products.some(
      (product) => product.id === productId,
    );

    if (!productBelongsToBusiness) {
      throw new Error("Solo puedes subir imagenes de productos propios.");
    }

    const path = buildProductImagePath(business.id, productId, file);
    const uploaded = await uploadGaremoImage(supabase, path, file);

    const { error: productError } = await supabase
      .from("products")
      .update({
        image_path: uploaded.path,
        image_url: uploaded.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (productError) {
      await supabase.storage.from("garemo-images").remove([uploaded.path]);
      throw new Error("La imagen subio, pero no pudimos guardar el producto.");
    }

    await loadDashboard();
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
    <DashboardShell onSignOut={signOut} userEmail={userEmail}>
      {error ? (
        <ErrorState title="No se pudo guardar" description={error} />
      ) : null}

      {accessState === "missing_profile" ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Completa tu perfil primero</h2>
          <p className="text-sm leading-6 text-muted">
            Tu cuenta de Auth existe, pero aun no tiene perfil Garemo activo.
            Crea una cuenta publica como comprador o vendedor para activar un
            perfil sin permisos admin.
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
          <h2 className="text-lg font-semibold">Panel solo para vendedores</h2>
          <p className="text-sm leading-6 text-muted">
            Esta cuenta no tiene rol vendedor. Puedes usar Garemo como
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
        <div className="space-y-5">
          <Card className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand" />
                <p className="text-sm font-medium text-brand">
                  Estado: {business.status}
                </p>
              </div>
              <p className="text-sm leading-6 text-muted">
                Puedes editar datos publicos de tu negocio, ubicacion, WhatsApp
                y productos. El badge verificado, el owner y el estado de
                aprobacion son campos protegidos y no se editan desde este
                panel.
              </p>
              <p className="text-xs leading-5 text-muted">
                Los cambios quedan sujetos a RLS owner-only: Garemo solo acepta
                edicion autenticada sobre datos propios.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <h2 className="text-sm font-semibold">Checklist de perfil</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {getProfileChecklist(business).map((item) => (
                  <li className="flex items-center gap-2" key={item.label}>
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-brand" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted" />
                    )}
                    <span className={item.done ? "" : "text-muted"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          <nav
            aria-label="Secciones del panel"
            className="flex gap-2 overflow-x-auto rounded-lg border border-border bg-surface p-2 text-sm font-medium text-muted"
          >
            {[
              ["Mi negocio", "#mi-negocio"],
              ["Estado del dia", "#estado-del-dia"],
              ["Horario y ubicacion", "#horario-y-ubicacion"],
              ["Productos", "#productos"],
            ].map(([label, href]) => (
              <a
                className="shrink-0 rounded-lg px-3 py-2 transition-colors hover:bg-background hover:text-foreground"
                href={href}
                key={href}
              >
                {label}
              </a>
            ))}
          </nav>
          <VendorBusinessForm
            business={business}
            isSaving={isSaving}
            onCoverUpload={uploadBusinessCover}
            onSave={saveBusiness}
          />
          <VendorProductList
            businessId={business.id}
            isSaving={isSaving}
            onImageUpload={uploadProductImage}
            onSave={saveProduct}
            products={business.products}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <EmptyState
            title="Aun no tienes negocio asignado"
            description="Puedes crear tu primer negocio desde este panel. Nacera como pendiente de revision y no sera publico hasta la aprobacion manual."
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
              aprobacion siguen a cargo de 2DevDogs.
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
