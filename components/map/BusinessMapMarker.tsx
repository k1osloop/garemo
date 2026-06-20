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
      <Popup>
        <div className="space-y-1">
          <p className="font-semibold">{business.name}</p>
          <p className="text-xs text-muted">
            {business.category?.name ?? "Categoria"}
          </p>
          <p className="text-xs">{business.location.address_text}</p>
          <Link
            className="text-xs font-semibold text-brand"
            href={`/businesses/${business.id}`}
          >
            Ver detalle
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
