import Link from "next/link";
import { Bike, MapPinned, Sparkles, Star } from "lucide-react";

import { BusinessGrid } from "@/components/business/BusinessGrid";
import { MobileFilters } from "@/components/business/MobileFilters";
import { PageShell } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  getCategories,
  searchVisibleBusinesses,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

type BusinessesPageProps = {
  searchParams?: Promise<{
    category?: string;
    delivery?: string;
    offers?: string;
    open?: string;
    pickup?: string;
    q?: string;
  }>;
};

export default async function BusinessesPage({
  searchParams,
}: BusinessesPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = resolvedSearchParams?.category;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const delivery = resolvedSearchParams?.delivery === "true";
  const pickup = resolvedSearchParams?.pickup === "true";
  const hasOffers = resolvedSearchParams?.offers === "true";
  const isOpen = resolvedSearchParams?.open === "true";

  const [categoriesResult, businessesResult] = await Promise.all([
    getCategories(),
    searchVisibleBusinesses({
      categorySlug: selectedCategory,
      delivery,
      hasOffers,
      isOpen,
      pickup,
      query,
    }),
  ]);

  const error = categoriesResult.error ?? businessesResult.error;
  const businesses = businessesResult.data;
  const promoCount = businesses.filter((business) =>
    business.products.some((product) => product.offer_price !== null),
  ).length;
  const deliveryCount = businesses.filter(
    (business) => business.delivery_available,
  ).length;
  const ratedCount = businesses.filter(
    (business) => (business.trust_summary?.review_count ?? 0) > 0,
  ).length;

  return (
    <PageShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-surface shadow-sm">
          <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_360px] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                <MapPinned className="h-4 w-4" />
                Directorio publico
              </div>
              <div className="max-w-2xl space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Negocios cerca del campus
                </h1>
                <p className="text-base leading-7 text-muted-foreground">
                  Explora productos, servicios y emprendimientos universitarios.
                  Busca rapido, revisa confianza y contacta directo por
                  WhatsApp.
                </p>
              </div>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-hover"
                href="/map"
              >
                <MapPinned className="h-4 w-4" />
                Ver mapa
              </Link>
            </div>
            <div className="rounded-3xl bg-[#fbfaf6] p-4 shadow-inner">
              <MobileFilters
                categories={categoriesResult.data ?? []}
                initialQuery={query}
              />
            </div>
          </div>
        </section>

        {error ? (
          <ErrorState
            description={error}
            title="No se pudo cargar el directorio"
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <SectionCard className="flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <MapPinned className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Cerca del campus
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {businesses.length} opciones visibles
                  </p>
                </div>
              </SectionCard>
              <SectionCard className="flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Promos universitarias
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {promoCount} negocios con oferta
                  </p>
                </div>
              </SectionCard>
              <SectionCard className="flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  {ratedCount > 0 ? (
                    <Star className="h-5 w-5" />
                  ) : (
                    <Bike className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {ratedCount > 0 ? "Mejor calificados" : "Delivery activo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ratedCount > 0
                      ? `${ratedCount} con opiniones`
                      : `${deliveryCount} con delivery`}
                  </p>
                </div>
              </SectionCard>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-foreground">
                  Todos los negocios
                </h2>
                <p className="text-sm text-muted-foreground">
                  Productos, confianza y contacto directo en un solo lugar.
                </p>
              </div>
            </div>

            <BusinessGrid businesses={businesses} query={query} />
          </div>
        )}
      </div>
    </PageShell>
  );
}
