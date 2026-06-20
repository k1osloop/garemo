import Link from "next/link";
import { MapPinned, Search } from "lucide-react";

import { BusinessGrid } from "@/components/business/BusinessGrid";
import { CategoryFilter } from "@/components/business/CategoryFilter";
import { PageShell } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  getActiveBusinesses,
  getBusinessesByCategory,
  getCategories,
  searchVisibleBusinesses,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

type BusinessesPageProps = {
  searchParams?: Promise<{
    category?: string;
    q?: string;
  }>;
};

export default async function BusinessesPage({
  searchParams,
}: BusinessesPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = resolvedSearchParams?.category;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const [categoriesResult, businessesResult] = await Promise.all([
    getCategories(),
    query
      ? searchVisibleBusinesses({ categorySlug: selectedCategory, query })
      : selectedCategory
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
              Busca productos, servicios y negocios visibles. Solo aparecen
              datos activos segun las politicas RLS de Supabase.
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

        <form
          action="/businesses"
          className="grid gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-[1fr_auto]"
        >
          {selectedCategory ? (
            <input name="category" type="hidden" value={selectedCategory} />
          ) : null}
          <label className="grid gap-2 text-sm font-medium">
            Buscar por producto o negocio
            <input
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-base outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
              defaultValue={query}
              name="q"
              placeholder="Ej: auriculares, cafe, anillado"
              type="search"
            />
          </label>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-teal-800 sm:self-end">
            <Search className="h-4 w-4" />
            Buscar
          </button>
        </form>

        <CategoryFilter
          categories={categoriesResult.data}
          query={query}
          selectedCategory={selectedCategory}
        />

        {error ? (
          <ErrorState
            title="No se pudo cargar el directorio"
            description={error}
          />
        ) : (
          <BusinessGrid businesses={businessesResult.data} query={query} />
        )}
      </div>
    </PageShell>
  );
}
