"use client";

import { useState } from "react";
import { MapPin, MessageCircle, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ContactInfo, Location, PublicBusiness } from "@/types/database";

export type VendorBusinessFormValues = {
  business: Pick<
    PublicBusiness,
    | "name"
    | "description"
    | "price_range"
    | "status_message"
    | "opens_at"
    | "closes_at"
  >;
  contact: Pick<ContactInfo, "whatsapp_number">;
  location: Pick<
    Location,
    "address_text" | "campus_zone" | "latitude" | "longitude"
  >;
};

type VendorBusinessFormProps = {
  business: PublicBusiness;
  isSaving: boolean;
  onSave: (values: VendorBusinessFormValues) => Promise<void>;
};

function timeValue(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function numberValue(value: number | null) {
  return value === null ? "" : String(value);
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  return text.length > 0 ? text : null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const parsed = Number(text);

  return Number.isFinite(parsed) ? parsed : null;
}

export function VendorBusinessForm({
  business,
  isSaving,
  onSave,
}: VendorBusinessFormProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);

    await onSave({
      business: {
        name: String(formData.get("name") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        price_range: nullableText(formData.get("price_range")),
        status_message: nullableText(formData.get("status_message")),
        opens_at: nullableText(formData.get("opens_at")),
        closes_at: nullableText(formData.get("closes_at")),
      },
      contact: {
        whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim(),
      },
      location: {
        address_text: String(formData.get("address_text") ?? "").trim(),
        campus_zone: nullableText(formData.get("campus_zone")),
        latitude: nullableNumber(formData.get("latitude")),
        longitude: nullableNumber(formData.get("longitude")),
      },
    });

    setMessage("Datos guardados.");
  }

  return (
    <Card>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold">Datos del negocio</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            defaultValue={business.name}
            label="Nombre"
            name="name"
            required
          />
          <Input
            defaultValue={business.price_range ?? ""}
            label="Rango de precios"
            name="price_range"
            placeholder="Bs 5 - 30"
          />
        </div>

        <label className="grid gap-2 text-sm font-medium">
          Descripcion
          <textarea
            className="min-h-28 rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            defaultValue={business.description}
            maxLength={500}
            name="description"
            required
          />
        </label>

        <Input
          defaultValue={business.status_message ?? ""}
          label="Mensaje de estado"
          maxLength={140}
          name="status_message"
          placeholder="Disponible hoy en campus"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            defaultValue={timeValue(business.opens_at)}
            label="Abre"
            name="opens_at"
            type="time"
          />
          <Input
            defaultValue={timeValue(business.closes_at)}
            label="Cierra"
            name="closes_at"
            type="time"
          />
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="h-4 w-4 text-brand" />
            Contacto
          </div>
          <Input
            defaultValue={business.contact_info?.whatsapp_number ?? ""}
            label="WhatsApp"
            name="whatsapp_number"
            required
          />
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-brand" />
            Ubicacion
          </div>
          <Input
            defaultValue={business.location?.address_text ?? ""}
            label="Referencia"
            name="address_text"
            required
          />
          <Input
            defaultValue={business.location?.campus_zone ?? ""}
            label="Zona campus"
            name="campus_zone"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              defaultValue={numberValue(business.location?.latitude ?? null)}
              label="Latitud"
              name="latitude"
              step="0.000001"
              type="number"
            />
            <Input
              defaultValue={numberValue(business.location?.longitude ?? null)}
              label="Longitud"
              name="longitude"
              step="0.000001"
              type="number"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button disabled={isSaving} type="submit">
            {isSaving ? "Guardando..." : "Guardar negocio"}
          </Button>
          {message ? <p className="text-sm text-brand">{message}</p> : null}
        </div>
      </form>
    </Card>
  );
}
