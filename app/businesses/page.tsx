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
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase text-brand">
            Directorio publico
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Negocios cerca del campus
          </h1>
          <p className="text-sm leading-6 text-muted">
            Explora categorias y abre perfiles visibles. Solo aparecen negocios
            activos segun las politicas RLS de Supabase.
          </p>
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
