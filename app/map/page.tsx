import { PageShell } from "@/components/layout/page-shell";
import { PublicMap } from "@/components/map/PublicMap";
import { ErrorState } from "@/components/ui/ErrorState";
import { getActiveBusinesses } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const businessesResult = await getActiveBusinesses();

  return (
    <PageShell>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase text-brand">
            Mapa publico
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Negocios visibles cerca del campus
          </h1>
          <p className="text-sm leading-6 text-muted">
            Explora negocios activos con ubicacion exacta. Los negocios sin
            coordenadas se mantienen disponibles en una lista segura.
          </p>
        </div>

        {businessesResult.error ? (
          <ErrorState
            title="No se pudo cargar el mapa"
            description={businessesResult.error}
          />
        ) : (
          <PublicMap businesses={businessesResult.data} />
        )}
      </div>
    </PageShell>
  );
}
