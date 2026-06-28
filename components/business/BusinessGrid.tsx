import { BusinessCard } from "@/components/business/BusinessCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PublicBusiness } from "@/types/database";

type BusinessGridProps = {
  businesses: PublicBusiness[];
  distanceLabels?: Record<string, string>;
  query?: string;
};

export function BusinessGrid({
  businesses,
  distanceLabels = {},
  query,
}: BusinessGridProps) {
  if (businesses.length === 0) {
    return (
      <EmptyState
        title={
          query
            ? "No encontramos resultados para tu busqueda"
            : "Todavia no hay negocios visibles"
        }
        description={
          query
            ? "Prueba con otro producto, categoria o nombre de negocio."
            : "Cuando un negocio este activo y aprobado, aparecera en este directorio publico."
        }
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {businesses.map((business) => (
        <BusinessCard
          business={business}
          distanceLabel={distanceLabels[business.id]}
          key={business.id}
        />
      ))}
    </div>
  );
}
