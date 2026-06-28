"use client";

import { LocateFixed, MapPin, ShieldAlert, X } from "lucide-react";
import { useMemo, useState } from "react";

import { BusinessGrid } from "@/components/business/BusinessGrid";
import { Button } from "@/components/ui/button";
import { distanceInMeters, formatDistance, type GeoPoint } from "@/lib/geo-distance";
import type { PublicBusiness } from "@/types/database";

type BusinessDirectoryClientProps = {
  businesses: PublicBusiness[];
  query?: string;
};

type DistanceInfo = {
  business: PublicBusiness;
  distance: number | null;
};

function businessPoint(business: PublicBusiness): GeoPoint | null {
  const latitude = business.location?.latitude;
  const longitude = business.location?.longitude;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return { latitude, longitude };
}

export function BusinessDirectoryClient({
  businesses,
  query,
}: BusinessDirectoryClientProps) {
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearMePoint, setNearMePoint] = useState<GeoPoint | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const distanceInfo = useMemo<DistanceInfo[]>(() => {
    if (!nearMePoint) {
      return businesses.map((business) => ({ business, distance: null }));
    }

    return businesses
      .map((business) => {
        const point = businessPoint(business);

        return {
          business,
          distance: point ? distanceInMeters(nearMePoint, point) : null,
        };
      })
      .sort((first, second) => {
        if (first.distance === null && second.distance === null) {
          return first.business.name.localeCompare(second.business.name);
        }

        if (first.distance === null) {
          return 1;
        }

        if (second.distance === null) {
          return -1;
        }

        return first.distance - second.distance;
      });
  }, [businesses, nearMePoint]);

  const sortedBusinesses = distanceInfo.map((item) => item.business);
  const distanceLabels = Object.fromEntries(
    distanceInfo
      .filter((item) => item.distance !== null)
      .map((item) => [item.business.id, formatDistance(item.distance ?? 0)]),
  );

  const handleNearMe = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError(
        "Tu navegador no permite usar ubicacion. Puedes seguir explorando negocios en el mapa.",
      );
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNearMePoint({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError(
          "No pudimos acceder a tu ubicacion. Puedes seguir explorando negocios en el mapa.",
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
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 rounded-3xl border border-border/70 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-foreground">
            {nearMePoint ? "Ordenado por cercania" : "Explora a tu ritmo"}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Tu ubicacion se usa solo en esta pantalla y no se guarda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-2xl font-extrabold"
            disabled={isLocating}
            onClick={handleNearMe}
            type="button"
          >
            <LocateFixed className="h-4 w-4" />
            {isLocating ? "Buscando..." : "Cerca de mi"}
          </Button>
          {nearMePoint ? (
            <Button
              className="rounded-2xl"
              onClick={() => setNearMePoint(null)}
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

      {nearMePoint && Object.keys(distanceLabels).length === 0 ? (
        <div className="flex gap-2 rounded-2xl border border-border bg-surface p-3 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          Los negocios visibles actuales aun no tienen coordenadas exactas.
        </div>
      ) : null}

      <BusinessGrid
        businesses={sortedBusinesses}
        distanceLabels={distanceLabels}
        query={query}
      />
    </div>
  );
}
