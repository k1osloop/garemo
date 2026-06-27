"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type ReportModalProps = {
  targetId: string;
  targetType: "business" | "product" | "review";
  isOpen: boolean;
  onClose: () => void;
};

const reportReasons = [
  { value: "inappropriate", label: "Foto/contenido inapropiado" },
  { value: "scam", label: "Posible estafa" },
  { value: "false_info", label: "Informacion falsa" },
  { value: "prohibited", label: "Producto prohibido" },
  { value: "duplicate", label: "Negocio duplicado" },
  { value: "closed", label: "Negocio cerrado" },
  { value: "abusive", label: "Mal trato / Abusivo" },
  { value: "spam", label: "Spam" },
  { value: "misleading", label: "Precio enganoso" },
  { value: "other", label: "Otro" },
];

export function ReportModal({
  targetId,
  targetType,
  isOpen,
  onClose,
}: ReportModalProps) {
  const [reason, setReason] =
    useState<Database["public"]["Enums"]["report_reason"]>("false_info");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: userResult } = await supabase.auth.getUser();

    if (!userResult.user) {
      setError("Inicia sesion para reportar.");
      setIsSubmitting(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc("submit_report", {
      p_target_type: targetType,
      p_target_id: targetId,
      p_reason: reason,
      p_description: description,
    });

    if (rpcError) {
      setError(
        rpcError.message.includes("Cannot report your own")
          ? "No puedes reportar tu propio negocio o productos."
          : rpcError.message.includes("duplicate key")
            ? "Ya enviaste un reporte para este elemento."
            : "Hubo un error al enviar el reporte.",
      );
    } else {
      setSuccess(true);
    }

    setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
      <button
        aria-label="Cerrar reporte"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        type="button"
      />

      <div className="relative flex min-h-[70dvh] max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl sm:min-h-0 sm:max-h-[85vh] sm:max-w-md sm:rounded-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-slate-50/95 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Reportar problema
          </div>
          <button
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-6 text-center">
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                Reporte enviado ✓
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Gracias por ayudarnos a mantener Garemo seguro. Revisaremos tu
                reporte pronto.
              </p>
            </div>
            <div className="shrink-0 border-t border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button className="min-h-12 w-full" onClick={onClose}>
                Reporte enviado ✓
              </Button>
            </div>
          </>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-8">
              <p className="text-sm leading-6 text-slate-600">
                Ayudanos a entender el problema. Tu reporte es anonimo para el
                emprendedor, pero nosotros lo revisaremos.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="report-reason">
                  Motivo del reporte
                </label>
                <select
                  className="min-h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="report-reason"
                  onChange={(e) =>
                    setReason(
                      e.target.value as Database["public"]["Enums"]["report_reason"],
                    )
                  }
                  required
                  value={reason}
                >
                  {reportReasons.map((reportReason) => (
                    <option key={reportReason.value} value={reportReason.value}>
                      {reportReason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="report-description"
                >
                  Detalles adicionales (opcional)
                </label>
                <textarea
                  className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="report-description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Especifica un poco mas para ayudarnos a investigar mejor..."
                  value={description}
                />
              </div>

              {error ? (
                <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="min-h-12"
                  disabled={isSubmitting}
                  onClick={onClose}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  className="min-h-12"
                  disabled={isSubmitting}
                  size="default"
                  type="submit"
                >
                  {isSubmitting ? "Enviando..." : "Enviar reporte"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
