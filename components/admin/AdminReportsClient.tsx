"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type ReportStatus = Database["public"]["Enums"]["report_status"];
type BusinessStatus = Database["public"]["Enums"]["business_status"];
type ReportFilter = ReportStatus | "all" | "critical";

type ReportBusiness = {
  id: string;
  name: string;
  status: BusinessStatus;
  is_verified: boolean;
};

type ReportRow = {
  id: string;
  reporter_id: string;
  business_id: string;
  target_type: string;
  target_id: string;
  reason: Database["public"]["Enums"]["report_reason"];
  description: string | null;
  details?: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  resolved_at?: string | null;
  business?: ReportBusiness | ReportBusiness[] | null;
};

const reportStatusLabels: Record<ReportFilter, string> = {
  all: "Todos",
  critical: "Criticos",
  dismissed: "Descartados",
  open: "Pendientes",
  resolved: "Resueltos",
  reviewing: "En revision",
};

const reportReasonLabels: Record<
  Database["public"]["Enums"]["report_reason"],
  string
> = {
  abusive: "Mal trato",
  closed: "Negocio cerrado",
  duplicate: "Duplicado",
  false_info: "Informacion falsa",
  inappropriate: "Contenido inapropiado",
  misleading: "Producto o precio enganoso",
  other: "Otro",
  prohibited: "Producto prohibido",
  scam: "Posible fraude",
  spam: "Spam",
};

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getStatusClassName(status: ReportStatus) {
  if (status === "open") return "bg-red-50 text-red-700 ring-red-100";
  if (status === "reviewing") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "resolved") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function countUniqueOpenReporters(reports: ReportRow[], businessId: string) {
  const reporters = new Set(
    reports
      .filter(
        (report) =>
          report.business_id === businessId &&
          (report.status === "open" || report.status === "reviewing"),
      )
      .map((report) => report.reporter_id),
  );

  return reporters.size;
}

export function AdminReportsClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportFilter>("open");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [notesByReport, setNotesByReport] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("reports")
      .select(
        `
        id,
        reporter_id,
        business_id,
        target_type,
        target_id,
        reason,
        description,
        details,
        status,
        admin_notes,
        created_at,
        resolved_at,
        business:businesses (
          id,
          name,
          status,
          is_verified
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (fetchError) {
      setError(
        "No pudimos cargar los reportes. Verifica que el SQL de moderacion este aplicado.",
      );
    } else {
      setReports(data as unknown as ReportRow[]);
    }

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReports]);

  async function updateStatus({
    businessStatus,
    reportId,
    nextStatus,
    successMessage,
  }: {
    businessStatus?: BusinessStatus | null;
    reportId: string;
    nextStatus: ReportStatus;
    successMessage: string;
  }) {
    setIsUpdating(reportId);
    setError(null);
    setStatusMessage(null);

    const { error: updateError } = await supabase.rpc("admin_resolve_report", {
      p_report_id: reportId,
      p_next_status: nextStatus,
      p_notes: notesByReport[reportId] || "Actualizado desde panel admin",
      p_business_status: businessStatus ?? null,
    });

    if (updateError) {
      setError(
        "No pudimos actualizar este reporte. Solo una cuenta autorizada puede moderarlo.",
      );
      setIsUpdating(null);
      return;
    }

    setStatusMessage(successMessage);
    await loadReports();
    setIsUpdating(null);
  }

  async function createModerationCase(report: ReportRow) {
    const business = firstOrNull(report.business);

    if (!business) {
      setError("No pudimos crear un caso porque el negocio no esta disponible.");
      return;
    }

    setIsUpdating(report.id);
    setError(null);
    setStatusMessage(null);

    const uniqueReporters = countUniqueOpenReporters(reports, report.business_id);
    const { error: caseError } = await supabase.rpc(
      "admin_create_moderation_thread",
      {
        target_business_id: report.business_id,
        target_report_id: report.id,
        thread_type: "report",
        thread_subject: "Reporte de la comunidad",
        initial_message:
          notesByReport[report.id] ||
          "Garemo esta revisando un reporte de la comunidad sobre tu negocio. Responde con contexto o corrige la informacion indicada.",
        thread_priority: uniqueReporters >= 3 ? "high" : "normal",
      },
    );

    if (caseError) {
      setError("No pudimos abrir el caso interno de este reporte.");
      setIsUpdating(null);
      return;
    }

    setStatusMessage("Caso interno creado para seguimiento con el emprendedor.");
    await updateStatus({
      reportId: report.id,
      nextStatus: "reviewing",
      successMessage: "Caso interno creado y reporte marcado en revision.",
    });
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando reportes...</p>
      </Card>
    );
  }

  if (error) {
    return <ErrorState title="No se pudieron cargar reportes" description={error} />;
  }

  const filteredReports = reports.filter((report) => {
    if (activeTab === "all") return true;
    if (activeTab === "critical") {
      return countUniqueOpenReporters(reports, report.business_id) >= 3;
    }

    return report.status === activeTab;
  });
  const openReportCount = reports.filter((report) => report.status === "open").length;

  return (
    <div className="space-y-6">
      {statusMessage ? (
        <Card className="border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-800">
          {statusMessage}
        </Card>
      ) : null}

      <div className="flex gap-2 overflow-x-auto border-b border-border pb-4">
        {(["open", "reviewing", "critical", "resolved", "dismissed", "all"] as const).map(
          (tab) => (
            <button
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors",
                activeTab === tab
                  ? "bg-brand text-white"
                  : "bg-surface text-slate-600 hover:bg-slate-100",
              )}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {reportStatusLabels[tab]}
              {tab === "open" && openReportCount > 0 ? ` (${openReportCount})` : ""}
            </button>
          ),
        )}
        <Button
          className="ml-auto shrink-0 gap-2"
          onClick={() => void loadReports()}
          type="button"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {filteredReports.length === 0 ? (
        <EmptyState
          title="Sin reportes"
          description={`No hay reportes en estado: ${reportStatusLabels[activeTab]}.`}
        />
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => {
            const business = firstOrNull(report.business);
            const isBusy = isUpdating === report.id;
            const uniqueReporters = countUniqueOpenReporters(
              reports,
              report.business_id,
            );

            return (
              <Card
                className="grid gap-4 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_260px]"
                key={report.id}
              >
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-black ring-1",
                        getStatusClassName(report.status),
                      )}
                    >
                      {reportStatusLabels[report.status]}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {reportReasonLabels[report.reason] ?? "Motivo reportado"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(report.created_at).toLocaleDateString("es-BO")}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-black ring-1",
                        uniqueReporters >= 3
                          ? "bg-red-50 text-red-700 ring-red-100"
                          : "bg-slate-100 text-slate-600 ring-slate-200",
                      )}
                    >
                      {uniqueReporters} reporte{uniqueReporters === 1 ? "" : "s"} unico{uniqueReporters === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      {business?.name ?? "Negocio no disponible"}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Reporte sobre {report.target_type === "business" ? "negocio" : "contenido relacionado"}.
                    </p>
                  </div>

                  {(report.description ?? report.details) ? (
                    <p className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                      {report.description ?? report.details}
                    </p>
                  ) : null}

                  {report.admin_notes ? (
                    <p className="rounded-2xl border border-brand/10 bg-brand/5 p-3 text-sm leading-6 text-brand">
                      Nota previa: {report.admin_notes}
                    </p>
                  ) : null}

                  <label className="grid gap-2 text-sm font-bold text-slate-800">
                    Nota admin
                    <textarea
                      className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      maxLength={1000}
                      onChange={(event) =>
                        setNotesByReport((current) => ({
                          ...current,
                          [report.id]: event.target.value,
                        }))
                      }
                      placeholder="Agrega contexto para resolver, descartar o suspender."
                      value={notesByReport[report.id] ?? ""}
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  {report.status === "open" ? (
                    <Button
                      className="justify-start gap-2"
                      disabled={isBusy}
                      onClick={() =>
                        void updateStatus({
                          reportId: report.id,
                          nextStatus: "reviewing",
                          successMessage: "Reporte marcado como en revision.",
                        })
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Clock className="h-4 w-4" />
                      En revision
                    </Button>
                  ) : null}

                  {report.status !== "resolved" && report.status !== "dismissed" ? (
                    <>
                      <Button
                        className="justify-start gap-2 border-brand/20 text-brand hover:bg-brand/5"
                        disabled={isBusy || !business}
                        onClick={() => void createModerationCase(report)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <MessageSquareText className="h-4 w-4" />
                        Abrir caso interno
                      </Button>
                      <Button
                        className="justify-start gap-2 bg-green-600 text-white hover:bg-green-700"
                        disabled={isBusy}
                        onClick={() =>
                          void updateStatus({
                            reportId: report.id,
                            nextStatus: "resolved",
                            successMessage: "Reporte resuelto y panel actualizado.",
                          })
                        }
                        size="sm"
                        type="button"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolver reporte
                      </Button>
                      <Button
                        className="justify-start gap-2 border-red-200 text-red-600 hover:bg-red-50"
                        disabled={isBusy}
                        onClick={() =>
                          void updateStatus({
                            reportId: report.id,
                            nextStatus: "dismissed",
                            successMessage: "Reporte descartado.",
                          })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Descartar
                      </Button>
                      <Button
                        className="justify-start gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                        disabled={isBusy || !business}
                        onClick={() =>
                          void updateStatus({
                            businessStatus: "under_review",
                            reportId: report.id,
                            nextStatus: "reviewing",
                            successMessage:
                              "Negocio suspendido temporalmente por revision.",
                          })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Ban className="h-4 w-4" />
                        Suspender negocio
                      </Button>
                      <Button
                        className="justify-start gap-2"
                        disabled={isBusy || !business}
                        onClick={() =>
                          void updateStatus({
                            businessStatus: "approved",
                            reportId: report.id,
                            nextStatus: "resolved",
                            successMessage:
                              "Negocio reactivado y reporte resuelto.",
                          })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reactivar negocio
                      </Button>
                    </>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
