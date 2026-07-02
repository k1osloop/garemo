"use client";

import { useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

import { AdminCasesClient } from "./AdminCasesClient";
import { AdminMetricsClient } from "./AdminMetricsClient";
import { AdminReportsClient } from "./AdminReportsClient";
import { AdminReviewClient } from "./AdminReviewClient";

type AdminTab = "businesses" | "cases" | "metrics" | "reports";

const tabs: {
  id: AdminTab;
  label: string;
  icon: typeof ClipboardCheck;
}[] = [
  { id: "businesses", label: "Negocios por verificar", icon: ClipboardCheck },
  { id: "reports", label: "Reportes", icon: ShieldCheck },
  { id: "cases", label: "Casos", icon: MessageSquareText },
  { id: "metrics", label: "Métricas", icon: BarChart3 },
];

export function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("businesses");

  return (
    <div className="min-w-0 space-y-6">
      <header className="rounded-[1.75rem] border border-brand/10 bg-gradient-to-br from-white via-[#fffaf0] to-brand/10 p-5 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-wide text-brand">
          Administracion
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
          Panel de Administrador
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Revisa negocios pendientes, reportes y senales de confianza antes de
          publicar cambios visibles.
        </p>
      </header>

      <div className="flex max-w-full gap-2 overflow-x-auto rounded-3xl border border-border/70 bg-white p-2 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "text-slate-500 hover:bg-[#FFF4E2] hover:text-slate-700"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "businesses" ? <AdminReviewClient /> : null}
      {activeTab === "reports" ? <AdminReportsClient /> : null}
      {activeTab === "cases" ? <AdminCasesClient /> : null}
      {activeTab === "metrics" ? <AdminMetricsClient /> : null}
    </div>
  );
}
