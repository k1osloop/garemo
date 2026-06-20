"use client";

import dynamic from "next/dynamic";

import { MapBusinessList } from "@/components/map/MapBusinessList";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MappedBusiness } from "@/components/map/BusinessMapMarker";
import type { PublicBusiness } from "@/types/database";

const LeafletMapCanvas = dynamic(
  () =>
    import("@/components/map/LeafletMapCanvas").then(
      (mod) => mod.LeafletMapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-80 items-center justify-center text-sm text-muted">
        Cargando mapa...
      </div>
    ),
  },
);

type PublicMapProps = {
  businesses: PublicBusiness[];
};

function hasExactLocation(business: PublicBusiness): business is MappedBusiness {
  return (
    Boolean(business.location) &&
    typeof business.location?.latitude === "number" &&
    typeof business.location?.longitude === "number"
  );
}

export function PublicMap({ businesses }: PublicMapProps) {
  const businessesWithCoordinates = businesses.filter(hasExactLocation);
  const businessesWithoutCoordinates = businesses.filter(
    (business) => !hasExactLocation(business),
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="min-h-96">
          <LeafletMapCanvas businesses={businessesWithCoordinates} />
        </div>
      </section>

      {businessesWithCoordinates.length === 0 ? (
        <EmptyState
          title="Todavia no hay negocios con ubicacion exacta"
          description="El mapa esta listo, pero los negocios visibles actuales no tienen latitud y longitud. Puedes revisarlos abajo por referencia textual."
        />
      ) : (
        <MapBusinessList
          businesses={businessesWithCoordinates}
          title="Negocios en el mapa"
        />
      )}

      <MapBusinessList
        businesses={businessesWithoutCoordinates}
        title="Sin ubicacion exacta"
      />
    </div>
  );
}
