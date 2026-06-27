import { MapPinned } from "lucide-react";

import { BusinessGrid } from "@/components/business/BusinessGrid";
import { CategoryFilter } from "@/components/business/CategoryFilter";
import { MobileFilters } from "@/components/business/MobileFilters";
import { PageShell } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  getCategories,
  searchVisibleBusinesses,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

type BusinessesPageProps = {
  searchParams?: Promise<{
    category?: string;
    q?: string;
    delivery?: string;
    pickup?: string;
    offers?: string;
    open?: string;
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
      query,
      delivery,
      pickup,
      hasOffers,
      isOpen
    })
  ]);
  const error = categoriesResult.error ?? businessesResult.error;

  return (
    <PageShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between bg-surface p-4 sm:p-6 rounded-2xl border border-border/60 shadow-sm">
          <div className="max-w-2xl space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MapPinned className="h-7 w-7 text-brand hidden sm:block" />
              Negocios cerca del campus
            </h1>
            <p className="text-sm text-muted-foreground">
              Encuentra lo que necesitas de emprendedores universitarios
            </p>
          </div>
          <div className="w-full sm:w-80">
            <MobileFilters 
              categories={categoriesResult.data ?? []}
              initialQuery={query}
            />
          </div>
        </div>

        {error ? (
          <ErrorState
            title="No se pudo cargar el directorio"
            description={error}
          />
        ) : (
          <div className="space-y-6">
            <CategoryFilter
              categories={categoriesResult.data ?? []}
              query={query}
              selectedCategory={selectedCategory}
              selectedFeatures={{ delivery, offers: hasOffers, open: isOpen }}
            />
            <BusinessGrid businesses={businessesResult.data} query={query} />
          </div>
        )}
      </div>

    </PageShell>
  );
}
