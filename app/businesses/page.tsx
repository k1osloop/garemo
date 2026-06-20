import Link from "next/link";
import { MapPinned } from "lucide-react";

import { BusinessGrid } from "@/components/business/BusinessGrid";
import { CategoryFilter } from "@/components/business/CategoryFilter";
import { PageShell } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  getActiveBusinesses,
  getBusinessesByCategory,
  getCategories,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

type BusinessesPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

export default async function BusinessesPage({
  searchParams,
}: BusinessesPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = resolvedSearchParams?.category;
  const [categoriesResult, businessesResult] = await Promise.all([
    getCategories(),
    selectedCategory
      ? getBusinessesByCategory(selectedCategory)
      : getActiveBusinesses(),
  ]);
  const error = categoriesResult.error ?? businessesResult.error;

  return (
    <PageShell>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-medium uppercase text-brand">
              Directorio publico
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Negocios cerca del campus
            </h1>
            <p className="text-sm leading-6 text-muted">
              Explora categorias y abre perfiles visibles. Solo aparecen
              negocios activos segun las politicas RLS de Supabase.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-background"
            href="/map"
          >
            <MapPinned className="h-4 w-4" />
            Ver mapa
          </Link>
        </div>

        <CategoryFilter
          categories={categoriesResult.data}
          selectedCategory={selectedCategory}
        />

        {error ? (
          <ErrorState
            title="No se pudo cargar el directorio"
            description={error}
          />
        ) : (
          <BusinessGrid businesses={businessesResult.data} />
        )}
      </div>
    </PageShell>
  );
}
