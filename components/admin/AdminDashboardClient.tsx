"use client";

import { useState } from "react";
import { AdminReviewClient } from "./AdminReviewClient";
import { AdminReportsClient } from "./AdminReportsClient";

export function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<"businesses" | "reports">("businesses");

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("businesses")}
          className={`pb-3 font-medium transition-colors ${
            activeTab === "businesses"
              ? "border-b-2 border-brand text-brand"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Negocios por verificar
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 font-medium transition-colors ${
            activeTab === "reports"
              ? "border-b-2 border-brand text-brand"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Reportes
        </button>
      </div>

      <div className="pt-2">
        {activeTab === "businesses" ? <AdminReviewClient /> : <AdminReportsClient />}
      </div>
    </div>
  );
}
