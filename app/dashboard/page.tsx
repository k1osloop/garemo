import { Store } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <PageShell title="Panel emprendedor">
      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-brand">
          <Store className="h-5 w-5" />
          <span className="text-sm font-medium">Placeholder Sprint 0</span>
        </div>
        <p className="text-sm leading-6 text-muted">
          El panel real del emprendedor, auth y permisos se implementaran luego
          de validar el flujo y ejecutar el esquema Supabase.
        </p>
      </Card>
    </PageShell>
  );
}
