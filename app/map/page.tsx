import Link from "next/link";
import { Search } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { PublicMap } from "@/components/map/PublicMap";
import { ErrorState } from "@/components/ui/ErrorState";
import { getActiveBusinesses } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const businessesResult = await getActiveBusinesses();

  return (
    <PageShell>
      <div className="min-w-0 space-y-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl min-w-0 space-y-2">
            <p className="text-sm font-medium uppercase text-brand">
              Mapa publico
            </p>
            <h1 className="text-3xl font-semibold leading-tight">
              Negocios visibles cerca del campus
            </h1>
            <p className="text-sm leading-6 text-muted">
              Explora negocios activos con ubicacion exacta. Los negocios sin
              coordenadas se mantienen disponibles en una lista segura.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-background"
            href="/businesses"
            prefetch={false}
          >
            <Search className="h-4 w-4" />
            Ver directorio
          </Link>
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
