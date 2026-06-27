"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ReportModalProps = {
  targetId: string;
  targetType: "business" | "product" | "review";
  isOpen: boolean;
  onClose: () => void;
};

const reportReasons = [
  { value: "inappropriate", label: "Foto/contenido inapropiado" },
  { value: "scam", label: "Posible estafa" },
  { value: "false_info", label: "Información falsa" },
  { value: "prohibited", label: "Producto prohibido" },
  { value: "duplicate", label: "Negocio duplicado" },
  { value: "closed", label: "Negocio cerrado" },
  { value: "abusive", label: "Mal trato / Abusivo" },
  { value: "spam", label: "Spam" },
  { value: "misleading", label: "Precio engañoso" },
  { value: "other", label: "Otro" },
];

import type { Database } from "@/types/database";

export function ReportModal({ targetId, targetType, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<Database["public"]["Enums"]["report_reason"]>("false_info");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: userResult } = await supabase.auth.getUser();
    
    if (!userResult.user) {
      setError("Inicia sesión para reportar.");
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
      setError(rpcError.message.includes("Cannot report your own") 
        ? "No puedes reportar tu propio negocio o productos." 
        : rpcError.message.includes("duplicate key") 
          ? "Ya enviaste un reporte para este elemento." 
          : "Hubo un error al enviar el reporte.");
    } else {
      setSuccess(true);
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-md rounded-xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Reportar problema
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {success ? (
            <div className="py-6 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 mb-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">Reporte enviado ✓</h3>
              <p className="text-sm text-slate-500">
                Gracias por ayudarnos a mantener Garemo seguro. Revisaremos tu reporte pronto.
              </p>
              <Button onClick={onClose} className="mt-4 w-full">Cerrar</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-600">
                Ayúdanos a entender el problema. Tu reporte es anónimo para el emprendedor, pero nosotros lo revisaremos.
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo del reporte</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value as Database["public"]["Enums"]["report_reason"])}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  {reportReasons.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Detalles adicionales (opcional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Por favor, especifica un poco más para ayudarnos a investigar mejor..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                  {error}
                </div>
              )}

              <div className="pt-4 border-t border-border mt-4 flex justify-end gap-2 sticky bottom-0 bg-background pb-safe sm:pb-1 pb-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} size="default" className="min-h-10">
                  {isSubmitting ? "Enviando..." : "Enviar reporte"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
