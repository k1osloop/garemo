"use client";

import { MapContainer, TileLayer } from "react-leaflet";

import {
  BusinessMapMarker,
  type MappedBusiness,
} from "@/components/map/BusinessMapMarker";

type LeafletMapCanvasProps = {
  businesses: MappedBusiness[];
  userCenter?: [number, number] | null;
};

const defaultCenter: [number, number] = [-17.7833, -63.1821];

function getMapCenter(businesses: MappedBusiness[]): [number, number] {
  const firstBusiness = businesses[0];

  if (!firstBusiness) {
    return defaultCenter;
  }

  return [firstBusiness.location.latitude, firstBusiness.location.longitude];
}

export function LeafletMapCanvas({
  businesses,
  userCenter = null,
}: LeafletMapCanvasProps) {
  const center = userCenter ?? getMapCenter(businesses);

  return (
    <MapContainer
      center={center}
      className="h-full min-h-96 w-full"
      key={`${center[0]}-${center[1]}`}
      scrollWheelZoom={false}
      zoom={userCenter ? 15 : businesses.length > 0 ? 16 : 13}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {businesses.map((business) => (
        <BusinessMapMarker business={business} key={business.id} />
      ))}
    </MapContainer>
  );
}
