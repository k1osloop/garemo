import { BusinessCard } from "@/components/business/BusinessCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PublicBusiness } from "@/types/database";

type BusinessGridProps = {
  businesses: PublicBusiness[];
};

export function BusinessGrid({ businesses }: BusinessGridProps) {
  if (businesses.length === 0) {
    return (
      <EmptyState
        title="Todavia no hay negocios visibles"
        description="Cuando un negocio este activo y aprobado, aparecera en este directorio publico."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {businesses.map((business) => (
        <BusinessCard business={business} key={business.id} />
      ))}
    </div>
  );
}
