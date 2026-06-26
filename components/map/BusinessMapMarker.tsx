"use client";

import L from "leaflet";
import Link from "next/link";
import { Marker, Popup } from "react-leaflet";

import type { PublicBusiness } from "@/types/database";

export type MappedBusiness = PublicBusiness & {
  location: NonNullable<PublicBusiness["location"]> & {
    latitude: number;
    longitude: number;
  };
};

type BusinessMapMarkerProps = {
  business: MappedBusiness;
};

const markerIcon = L.divIcon({
  className: "",
  html: '<span class="garemo-map-marker">G</span>',
  iconAnchor: [15, 30],
  iconSize: [30, 30],
  popupAnchor: [0, -28],
});

export function BusinessMapMarker({ business }: BusinessMapMarkerProps) {
  return (
    <Marker
      icon={markerIcon}
      position={[business.location.latitude, business.location.longitude]}
    >
      <Popup className="garemo-popup">
        <div className="space-y-2 p-1 min-w-[160px]">
          <div>
            <p className="font-bold text-base leading-tight">{business.name}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand mt-0.5">
              {business.category?.name ?? "Categoría"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {business.location.address_text}
          </p>
          <div className="flex items-center gap-3 pt-2 border-t border-border mt-2">
            <Link
              className="text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
              href={`/businesses/${business.id}`}
            >
              Ver perfil
            </Link>
            <a
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              href={`https://www.google.com/maps/dir/?api=1&destination=${business.location.latitude},${business.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cómo llegar
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
