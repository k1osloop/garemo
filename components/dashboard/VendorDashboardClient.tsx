"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("resumen");

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
    if (!business || !userId) {
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
      .eq("id", business.id)
      .eq("owner_id", userId);

    if (businessError) {
      setError("No pudimos guardar el negocio. RLS solo permite datos propios.");
      setIsSaving(false);
      return false;
    }

    if (business.location) {
      const { error: locationError } = await supabase
        .from("locations")
        .update({
          ...values.location,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", business.id);

      if (locationError) {
        setError("No pudimos guardar la ubicación.");
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
        setError("No pudimos guardar la ubicación.");
        setIsSaving(false);
        return false;
      }
    }

    if (business.contact_info) {
      const { error: contactError } = await supabase
        .from("contact_info")
        .update({
          ...values.contact,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", business.id);

      if (contactError) {
        setError("No pudimos guardar WhatsApp.");
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
        setError("No pudimos guardar WhatsApp.");
        setIsSaving(false);
        return false;
      }
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

    const { image_file, ...productValues } = values;

    const payload = {
      ...productValues,
      updated_at: new Date().toISOString(),
    };

    let targetProductId = productId;

    if (productId) {
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
      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert({
          ...payload,
          business_id: business.id,
        })
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
        setError("El producto se guardó, pero hubo un error al subir la imagen.");
        await loadDashboard();
        setIsSaving(false);
        return false;
      }
    }

    await loadDashboard();
    setIsSaving(false);
    return true;
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
      throw new Error("La imagen subió, pero no pudimos guardar metadata.");
    }

    await loadDashboard();
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
      throw new Error("La imagen subió, pero no pudimos guardar el producto.");
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
            Crea una cuenta pública como comprador o emprendedor para activar un
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
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <aside className="lg:w-64 shrink-0">
              <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide lg:sticky lg:top-24">
                {[
                  { id: "resumen", label: "Resumen" },
                  { id: "perfil", label: "Perfil del negocio" },
                  { id: "ubicacion", label: "Ubicación y horarios" },
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
                <Card className="grid gap-6 lg:grid-cols-2 shadow-sm border-slate-200">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <ShieldCheck className="h-6 w-6 text-brand" />
                      <div>
                        <h2 className="text-sm font-medium uppercase text-muted-foreground tracking-wider">Estado Actual</h2>
                        <p className="text-base font-bold text-slate-800">
                          {business.status === "pending_review" ? "En revisión" : business.status === "active" ? "Activo y visible" : business.status}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Aquí puedes gestionar tu presencia en Garemo. Recuerda que la aprobación final y la insignia de verificado son administradas por 2DevDogs.
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
                  isSaving={isSaving}
                  onImageUpload={uploadProductImage}
                  onSave={saveProduct}
                  products={business.products}
                />
              </div>
            </main>
          </div>
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
