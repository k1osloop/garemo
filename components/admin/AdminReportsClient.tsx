"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  details?: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  resolved_at?: string | null;
};

export function AdminReportsClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportStatus | "all">("open");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (fetchError) {
      setError("No pudimos cargar los reportes. Verifica que la tabla exista y tengas acceso.");
    } else {
      setReports(data as ReportRow[]);
    }
    
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReports]);

  const updateStatus = async (reportId: string, nextStatus: ReportStatus) => {
    setIsUpdating(reportId);
    const { error } = await supabase.rpc("admin_resolve_report", {
      p_report_id: reportId,
      p_next_status: nextStatus,
      p_notes: "Actualizado desde panel admin",
    });

    if (!error) {
      void loadReports();
    } else {
      alert("Error al actualizar: " + error.message);
    }
    setIsUpdating(null);
  };

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando reportes...</p>
      </Card>
    );
  }

  if (error) {
    return <ErrorState title="Error" description={error} />;
  }

  const filteredReports = reports.filter(r => activeTab === "all" || r.status === activeTab);
  const openReportCount = reports.filter((report) => report.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 pb-4 border-b border-border overflow-x-auto">
        {(["open", "reviewing", "resolved", "dismissed", "all"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? "bg-brand text-white" 
                : "bg-surface hover:bg-slate-100 text-slate-600"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "open" && openReportCount > 0 ? ` (${openReportCount})` : ""}
          </button>
        ))}
      </div>

      {filteredReports.length === 0 ? (
        <EmptyState 
          title="Sin reportes" 
          description={`No hay reportes en estado: ${activeTab}`} 
        />
      ) : (
        <div className="grid gap-4">
          {filteredReports.map(report => (
            <Card key={report.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    report.status === "open" ? "bg-red-100 text-red-700" :
                    report.status === "reviewing" ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {report.status.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    Motivo: {report.reason}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm">
                  <span className="font-medium text-slate-600">Tipo:</span> {report.target_type} | 
                  <span className="font-medium text-slate-600 ml-2">ID:</span> {report.target_id.split('-')[0]}...
                </p>
                
                {(report.description ?? report.details) && (
                  <p className="text-sm bg-slate-50 p-2 rounded border border-slate-100 mt-2 text-slate-600">
                    &quot;{report.description ?? report.details}&quot;
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 min-w-[140px]">
                {report.status === "open" && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => updateStatus(report.id, "reviewing")}
                    disabled={isUpdating === report.id}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    En revisión
                  </Button>
                )}
                {report.status !== "resolved" && report.status !== "dismissed" && (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatus(report.id, "resolved")}
                      disabled={isUpdating === report.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolver
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => updateStatus(report.id, "dismissed")}
                      disabled={isUpdating === report.id}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Descartar
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
