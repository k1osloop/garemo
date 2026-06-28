"use client";

import dynamic from "next/dynamic";
import { LocateFixed, ShieldAlert, X } from "lucide-react";
import { useMemo, useState } from "react";

import { MapBusinessList } from "@/components/map/MapBusinessList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import type { MappedBusiness } from "@/components/map/BusinessMapMarker";
import { distanceInMeters, formatDistance, type GeoPoint } from "@/lib/geo-distance";
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userPoint, setUserPoint] = useState<GeoPoint | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const businessesWithCoordinates = businesses.filter(hasExactLocation);
  const businessesWithoutCoordinates = businesses.filter(
    (business) => !hasExactLocation(business),
  );
  const distanceLabels = useMemo(
    () =>
      Object.fromEntries(
        userPoint
          ? businessesWithCoordinates.map((business) => [
              business.id,
              formatDistance(
                distanceInMeters(userPoint, {
                  latitude: business.location.latitude,
                  longitude: business.location.longitude,
                }),
              ),
            ])
          : [],
      ),
    [businessesWithCoordinates, userPoint],
  );

  const sortedMappedBusinesses = useMemo(() => {
    if (!userPoint) {
      return businessesWithCoordinates;
    }

    return [...businessesWithCoordinates].sort(
      (first, second) =>
        distanceInMeters(userPoint, {
          latitude: first.location.latitude,
          longitude: first.location.longitude,
        }) -
        distanceInMeters(userPoint, {
          latitude: second.location.latitude,
          longitude: second.location.longitude,
        }),
    );
  }, [businessesWithCoordinates, userPoint]);

  const requestUserLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Tu navegador no permite usar ubicacion.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPoint({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError(
          "No pudimos acceder a tu ubicacion. Puedes seguir explorando el mapa manualmente.",
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  };

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-foreground">
            {userPoint ? "Mapa centrado cerca de ti" : "Encuentra negocios cercanos"}
          </p>
          <p className="text-xs text-muted-foreground">
            La ubicacion se usa solo en tu navegador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-2xl font-extrabold"
            disabled={isLocating}
            onClick={requestUserLocation}
            type="button"
          >
            <LocateFixed className="h-4 w-4" />
            {isLocating ? "Buscando..." : "Cerca de mi"}
          </Button>
          {userPoint ? (
            <Button
              className="rounded-2xl"
              onClick={() => setUserPoint(null)}
              type="button"
              variant="outline"
            >
              <X className="h-4 w-4" />
              Quitar
            </Button>
          ) : null}
        </div>
      </div>

      {locationError ? (
        <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {locationError}
        </div>
      ) : null}

      <section className="max-w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="min-h-[22rem] sm:min-h-96">
          <LeafletMapCanvas
            businesses={sortedMappedBusinesses}
            userCenter={
              userPoint ? [userPoint.latitude, userPoint.longitude] : null
            }
          />
        </div>
      </section>

      {businessesWithCoordinates.length === 0 ? (
        <EmptyState
          title="Todavia no hay negocios con ubicacion exacta"
          description="El mapa esta listo, pero los negocios visibles actuales no tienen latitud y longitud. Puedes revisarlos abajo por referencia textual."
        />
      ) : (
        <MapBusinessList
          businesses={sortedMappedBusinesses}
          distanceLabels={distanceLabels}
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
