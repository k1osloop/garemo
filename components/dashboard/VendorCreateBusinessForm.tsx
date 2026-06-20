"use client";

import { useState } from "react";
import { MapPin, MessageCircle, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Category, ContactInfo, Location } from "@/types/database";

export type VendorCreateBusinessFormValues = {
  business: {
    category_id: string;
    name: string;
    description: string;
    status_message: string | null;
    opens_at: string | null;
    closes_at: string | null;
  };
  contact: Pick<ContactInfo, "whatsapp_number">;
  location: Pick<
    Location,
    "address_text" | "campus_zone" | "latitude" | "longitude"
  >;
};

type VendorCreateBusinessFormProps = {
  categories: Category[];
  isSaving: boolean;
  onCreate: (values: VendorCreateBusinessFormValues) => Promise<boolean>;
};

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

export function VendorCreateBusinessForm({
  categories,
  isSaving,
  onCreate,
}: VendorCreateBusinessFormProps) {
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const values = {
      business: {
        category_id: String(formData.get("category_id") ?? ""),
        name: String(formData.get("name") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
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
    };

    const validationError = validateCreateBusinessValues(values, categories);

    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const created = await onCreate(values);

    if (created) {
      setMessage({
        type: "success",
        text: "Negocio creado y enviado a revision.",
      });
    }
  }

  return (
    <Card>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold">Crear primer negocio</h2>
          </div>
          <p className="text-sm leading-6 text-muted">
            Tu negocio se creara como pendiente de revision. No sera publico
            hasta que 2DevDogs lo apruebe manualmente.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            maxLength={90}
            minLength={2}
            name="name"
            placeholder="Ej. Cafe Central"
            required
          />
          <label className="grid gap-2 text-sm font-medium">
            Categoria
            <select
              className="min-h-11 rounded-lg border border-border bg-surface px-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              defaultValue=""
              name="category_id"
              required
            >
              <option disabled value="">
                Selecciona una categoria
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium">
          Descripcion
          <textarea
            className="min-h-28 rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            maxLength={500}
            minLength={12}
            name="description"
            placeholder="Cuenta que vendes, donde entregas y para quien sirve."
            required
          />
          <span className="text-xs font-normal text-muted">
            Minimo 12 caracteres. Evita promesas que no puedas cumplir.
          </span>
        </label>

        <Input
          label="Mensaje de estado"
          maxLength={140}
          name="status_message"
          placeholder="Disponible hoy en campus"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Abre" name="opens_at" type="time" />
          <Input label="Cierra" name="closes_at" type="time" />
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="h-4 w-4 text-brand" />
            Contacto
          </div>
          <Input
            label="WhatsApp"
            maxLength={24}
            name="whatsapp_number"
            placeholder="+59170000000"
            required
            type="tel"
          />
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-brand" />
            Ubicacion
          </div>
          <Input
            label="Referencia"
            name="address_text"
            placeholder="Patio central, modulo B"
            required
          />
          <Input
            label="Zona campus"
            name="campus_zone"
            placeholder="Facultad, bloque o patio"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Latitud"
              name="latitude"
              step="0.000001"
              type="number"
            />
            <Input
              label="Longitud"
              name="longitude"
              step="0.000001"
              type="number"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            disabled={isSaving || categories.length === 0}
            type="submit"
          >
            {isSaving ? "Creando..." : "Crear negocio"}
          </Button>
          {message ? (
            <p
              className={
                message.type === "error"
                  ? "text-sm text-red-600"
                  : "text-sm text-brand"
              }
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function validateCreateBusinessValues(
  values: VendorCreateBusinessFormValues,
  categories: Category[],
) {
  if (!categories.some((category) => category.id === values.business.category_id)) {
    return "Selecciona una categoria valida.";
  }

  if (values.business.name.length < 2) {
    return "El nombre debe tener al menos 2 caracteres.";
  }

  if (values.business.description.length < 12) {
    return "La descripcion debe tener al menos 12 caracteres.";
  }

  if (!/^\+?[0-9\s-]{8,24}$/.test(values.contact.whatsapp_number)) {
    return "WhatsApp debe tener solo numeros, espacios, guiones o +.";
  }

  if (values.location.address_text.length < 4) {
    return "Agrega una referencia de ubicacion mas clara.";
  }

  if (
    values.location.latitude !== null &&
    (values.location.latitude < -90 || values.location.latitude > 90)
  ) {
    return "La latitud debe estar entre -90 y 90.";
  }

  if (
    values.location.longitude !== null &&
    (values.location.longitude < -180 || values.location.longitude > 180)
  ) {
    return "La longitud debe estar entre -180 y 180.";
  }

  if (
    (values.location.latitude === null) !==
    (values.location.longitude === null)
  ) {
    return "Completa latitud y longitud juntas, o deja ambas vacias.";
  }

  if (
    values.business.opens_at &&
    values.business.closes_at &&
    values.business.opens_at >= values.business.closes_at
  ) {
    return "La hora de cierre debe ser posterior a la hora de apertura.";
  }

  return null;
}
