"use client";

import { useRef, useState } from "react";
import { Clock3, MapPin, MessageCircle, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { getBusinessCoverImage } from "@/lib/business-display";
import { cn } from "@/lib/utils";
import type { ContactInfo, Location, PublicBusiness, Schedule } from "@/types/database";

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
  schedules: Pick<
    Schedule,
    "day_of_week" | "opens_at" | "closes_at" | "is_closed"
  >[];
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

const weekDays = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
  { value: 0, label: "Domingo" },
];

function scheduleByDay(business: PublicBusiness, dayOfWeek: number) {
  return business.schedules.find(
    (schedule) => schedule.day_of_week === dayOfWeek,
  );
}

function defaultScheduleTime(
  schedule: Schedule | undefined,
  fallback: string | null,
) {
  return timeValue(schedule?.opens_at ?? fallback);
}

function defaultScheduleCloseTime(
  schedule: Schedule | undefined,
  fallback: string | null,
) {
  return timeValue(schedule?.closes_at ?? fallback);
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
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [geoStatus, setGeoStatus] = useState<"idle" | "detecting" | "success" | "error">("idle");
  const resetTimerRef = useRef<number | null>(null);

  function resetSaveStatusLater() {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setSaveStatus("idle");
    }, 2500);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSaveStatus("saving");

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
      schedules: weekDays.map((day) => {
        const isClosed = formData.get(`schedule_${day.value}_closed`) === "on";

        return {
          day_of_week: day.value,
          opens_at: isClosed
            ? null
            : nullableText(formData.get(`schedule_${day.value}_opens_at`)),
          closes_at: isClosed
            ? null
            : nullableText(formData.get(`schedule_${day.value}_closes_at`)),
          is_closed: isClosed,
        };
      }),
    };

    const validationError = validateBusinessValues(values);

    if (validationError) {
      setMessage({ type: "error", text: validationError });
      setSaveStatus("error");
      resetSaveStatusLater();
      return;
    }

    const saved = await onSave(values);

    if (saved) {
      setSaveStatus("success");
      setMessage({
        type: "success",
        text: activeTab === "ubicacion" 
          ? "Ubicación y horarios guardados ✓" 
          : "Tu negocio se guardo correctamente.",
      });
    } else {
      setSaveStatus("error");
      setMessage({
        type: "error",
        text: "No pudimos guardar. Intenta nuevamente.",
      });
    }

    resetSaveStatusLater();
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
              el rol de emprendedor y el estado de aprobación se gestionan manualmente por
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
              <Clock3 className="h-4 w-4 text-brand" />
              Horarios semanales
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Estos horarios se muestran publicamente en la pagina de tu negocio.
              Marca cerrado los dias en los que no atiendes.
            </p>
          </div>

          <div className="space-y-3">
            {weekDays.map((day) => {
              const schedule = scheduleByDay(business, day.value);

              return (
                <div
                  className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end"
                  key={day.value}
                >
                  <div className="text-sm font-medium">{day.label}</div>
                  <Input
                    defaultValue={defaultScheduleTime(
                      schedule,
                      business.opens_at,
                    )}
                    label="Abre"
                    name={`schedule_${day.value}_opens_at`}
                    type="time"
                  />
                  <Input
                    defaultValue={defaultScheduleCloseTime(
                      schedule,
                      business.closes_at,
                    )}
                    label="Cierra"
                    name={`schedule_${day.value}_closes_at`}
                    type="time"
                  />
                  <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm">
                    <input
                      className="h-4 w-4 accent-brand"
                      defaultChecked={schedule?.is_closed ?? false}
                      name={`schedule_${day.value}_closed`}
                      type="checkbox"
                    />
                    Cerrado
                  </label>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-brand" />
              Ubicación
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Ayuda a tus clientes a encontrarte fácilmente dentro o cerca del campus.
            </p>
          </div>
          <Input
            defaultValue={business.location?.address_text ?? ""}
            label="Ubicación del negocio"
            name="address_text"
            placeholder="Ej: Módulo 236, pasillo central, cerca de la fotocopiadora"
            required
          />
          <Input
            defaultValue={business.location?.campus_zone ?? ""}
            label="Referencia (opcional)"
            name="campus_zone"
            placeholder="Ej: Puerta principal"
          />

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Ubicación exacta (Mapa)</p>
              <button 
                type="button" 
                onClick={() => {
                  const el = document.getElementById("advanced-location");
                  if (el) el.classList.toggle("hidden");
                }}
                className="text-xs text-brand hover:underline"
              >
                Ubicación avanzada
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground italic mb-2">
              Esta ubicación será visible para compradores.
            </p>
            <Button
              type="button"
              variant="secondary"
              disabled={geoStatus === "detecting"}
              onClick={() => {
                if (!navigator.geolocation) {
                  setGeoStatus("error");
                  alert("Tu navegador no soporta geolocalización.");
                  return;
                }
                setGeoStatus("detecting");
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const latInput = document.getElementById("lat-input") as HTMLInputElement;
                    const lngInput = document.getElementById("lng-input") as HTMLInputElement;
                    if (latInput) latInput.value = position.coords.latitude.toString();
                    if (lngInput) lngInput.value = position.coords.longitude.toString();
                    setGeoStatus("success");
                    
                    // Show advanced location automatically so they can verify
                    const el = document.getElementById("advanced-location");
                    if (el) el.classList.remove("hidden");
                    
                    setTimeout(() => setGeoStatus("idle"), 3000);
                  },
                  () => {
                    setGeoStatus("error");
                    alert("No pudimos obtener tu ubicación. Permite el acceso o ingrésala manualmente.");
                    setTimeout(() => setGeoStatus("idle"), 3000);
                  },
                  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
              }}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              {geoStatus === "detecting" ? "Detectando..." : geoStatus === "success" ? "Ubicación detectada ✓" : "Usar mi ubicación actual"}
            </Button>
            
            <div id="advanced-location" className="hidden grid gap-4 sm:grid-cols-2 pt-2 border-t border-border mt-4">
              <Input
                id="lat-input"
                defaultValue={numberValue(business.location?.latitude ?? null)}
                label="Latitud"
                name="latitude"
                step="0.000001"
                type="number"
              />
              <Input
                id="lng-input"
                defaultValue={numberValue(business.location?.longitude ?? null)}
                label="Longitud"
                name="longitude"
                step="0.000001"
                type="number"
              />
            </div>
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
            {getSaveButtonText(saveStatus, isSaving, activeTab)}
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
          Solo se envian campos editables; verificación, rol de emprendedor y aprobación no
          viajan desde este formulario.
        </p>
      </div>
    </form>
  );
}

function getSaveButtonText(
  saveStatus: "idle" | "saving" | "success" | "error",
  isSaving: boolean,
  activeTab: string,
) {
  if (isSaving || saveStatus === "saving") {
    return "Guardando...";
  }

  if (saveStatus === "success") {
    return activeTab === "ubicacion" ? "Ubicación y horarios guardados ✓" : "Negocio guardado ✓";
  }

  if (saveStatus === "error") {
    return "No se pudo guardar";
  }

  return activeTab === "ubicacion" ? "Guardar ubicación y horarios" : "Guardar cambios";
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

  for (const schedule of values.schedules) {
    if (schedule.is_closed) {
      continue;
    }

    if (!schedule.opens_at && !schedule.closes_at) {
      continue;
    }

    if (!schedule.opens_at || !schedule.closes_at) {
      return "Completa hora de apertura y cierre para cada dia abierto.";
    }

    if (schedule.opens_at >= schedule.closes_at) {
      return "Cada dia abierto debe cerrar despues de la hora de apertura.";
    }
  }

  return null;
}
