"use client";

import { MapContainer, TileLayer } from "react-leaflet";

import {
  BusinessMapMarker,
  type MappedBusiness,
} from "@/components/map/BusinessMapMarker";

type LeafletMapCanvasProps = {
  businesses: MappedBusiness[];
};

const defaultCenter: [number, number] = [-17.7833, -63.1821];

function getMapCenter(businesses: MappedBusiness[]): [number, number] {
  const firstBusiness = businesses[0];

  if (!firstBusiness) {
    return defaultCenter;
  }

  return [firstBusiness.location.latitude, firstBusiness.location.longitude];
}

export function LeafletMapCanvas({ businesses }: LeafletMapCanvasProps) {
  return (
    <MapContainer
      center={getMapCenter(businesses)}
      className="h-full min-h-80 w-full"
      scrollWheelZoom={false}
      zoom={businesses.length > 0 ? 16 : 13}
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
