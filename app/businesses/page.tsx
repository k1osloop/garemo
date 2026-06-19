import { BusinessCard } from "@/components/business/business-card";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";

const placeholderBusinesses = [
  {
    category: "Comida y snacks",
    name: "Almuerzos del bloque central",
    zone: "Campus piloto",
  },
  {
    category: "Materiales e impresiones",
    name: "Impresiones cerca de biblioteca",
    zone: "Zona biblioteca",
  },
];

export default function BusinessesPage() {
  return (
    <PageShell title="Directorio">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Datos de ejemplo para validar estructura visual. La conexion real con
          Supabase queda fuera de Sprint 0.
        </p>
        <div className="grid gap-3">
          {placeholderBusinesses.map((business) => (
            <BusinessCard key={business.name} {...business} />
          ))}
        </div>
        <EmptyState
          title="Busqueda real pendiente"
          description="Filtros, paginacion y datos activos se implementan en Sprint 1."
        />
      </div>
    </PageShell>
  );
}
