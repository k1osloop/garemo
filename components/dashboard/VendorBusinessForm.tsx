"use client";

import { useState } from "react";
import { Clock3, MapPin, MessageCircle, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { getBusinessCoverImage } from "@/lib/business-display";
import { cn } from "@/lib/utils";
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
    | "delivery_available"
    | "pickup_available"
    | "delivery_notes"
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
  onCoverUpload: (file: File) => Promise<string>;
  onSave: (values: VendorBusinessFormValues) => Promise<boolean>;
  activeTab?: string;
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
  onCoverUpload,
  onSave,
  activeTab = "perfil",
}: VendorBusinessFormProps) {
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
        name: String(formData.get("name") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        price_range: nullableText(formData.get("price_range")),
        status_message: nullableText(formData.get("status_message")),
        opens_at: nullableText(formData.get("opens_at")),
        closes_at: nullableText(formData.get("closes_at")),
        delivery_available: formData.get("delivery_available") === "on",
        pickup_available: formData.get("pickup_available") === "on",
        delivery_notes: nullableText(formData.get("delivery_notes")),
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

    const validationError = validateBusinessValues(values);

    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const saved = await onSave(values);

    if (saved) {
      setMessage({ type: "success", text: "Datos guardados." });
    }
  }

  return (
    <form className={cn("space-y-6", (activeTab !== "perfil" && activeTab !== "ubicacion") && "hidden")} onSubmit={handleSubmit}>
      <div className={cn("space-y-6", activeTab !== "perfil" && "hidden")}>
        <Card className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Mi negocio</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Edita la información pública que verá un comprador. La verificación,
              el owner y el estado de aprobación se gestionan manualmente por
              seguridad.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                defaultValue={business.name}
                label="Nombre"
                maxLength={90}
                minLength={2}
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
              Descripción
              <textarea
                className="min-h-28 rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                defaultValue={business.description}
                maxLength={500}
                minLength={12}
                name="description"
                required
              />
              <span className="text-xs font-normal text-muted-foreground">
                Mínimo 12 caracteres. Explica qué vendes y dónde estás.
              </span>
            </label>

            <Input
              defaultValue={business.contact_info?.whatsapp_number ?? ""}
              label="WhatsApp"
              maxLength={24}
              name="whatsapp_number"
              placeholder="+59170000000"
              required
              type="tel"
            />

            <ImageUploadField
              currentUrl={getBusinessCoverImage(business)}
              description="Imagen principal del negocio. Se sube a Supabase Storage bajo la carpeta segura de tu negocio."
              disabled={isSaving}
              label="Imagen del negocio"
              onUpload={onCoverUpload}
            />
          </div>
        </Card>
      </div>

      <div className={cn("space-y-6", activeTab !== "ubicacion" && "hidden")}>
        <Card className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="h-4 w-4 text-brand" />
              Estado del día
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Muestra disponibilidad simple para compradores. No es tracking en
              tiempo real: mantenlo actualizado cuando cambie tu presencia.
            </p>
          </div>
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
        </Card>

        <Card className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-brand" />
              Ubicación
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Usa una referencia humana clara. Latitud y longitud son opcionales,
              pero si completas una debes completar ambas.
            </p>
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
        </Card>

        <Card className="space-y-4 border-l-4 border-l-brand">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Store className="h-4 w-4 text-brand" />
              Opciones de entrega
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Indica cómo pueden obtener tus productos. Esto es sólo informativo para los compradores.
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-slate-50 cursor-pointer">
              <input 
                type="checkbox" 
                name="delivery_available" 
                defaultChecked={business.delivery_available}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">Delivery disponible</p>
                <p className="text-xs text-muted-foreground">Haces envíos a los compradores.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-slate-50 cursor-pointer">
              <input 
                type="checkbox" 
                name="pickup_available" 
                defaultChecked={business.pickup_available}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">Recojo en punto</p>
                <p className="text-xs text-muted-foreground">Los compradores pueden pasar a recoger.</p>
              </div>
            </label>
          </div>
          
          <Input
            defaultValue={business.delivery_notes ?? ""}
            label="Notas de entrega"
            name="delivery_notes"
            placeholder="Ej. Delivery gratis en Campus Norte. Recojo en puerta 3."
            maxLength={140}
          />
        </Card>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button disabled={isSaving} type="submit">
            {isSaving ? "Guardando..." : "Guardar negocio"}
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
        <p className="mt-2 flex items-center gap-2 text-xs leading-5 text-muted">
          <MessageCircle className="h-3.5 w-3.5 text-brand" />
          Solo se envian campos editables; verificacion, owner y aprobacion no
          viajan desde este formulario.
        </p>
      </div>
    </form>
  );
}

function validateBusinessValues(values: VendorBusinessFormValues) {
  if (values.business.name.length < 2) {
    return "El nombre debe tener al menos 2 caracteres.";
  }

  if (values.business.description.length < 12) {
    return "La descripcion debe tener al menos 12 caracteres.";
  }

  if (!/^\+?[0-9\s-]{8,24}$/.test(values.contact.whatsapp_number)) {
    return "WhatsApp debe tener solo numeros, espacios, guiones o +.";
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
