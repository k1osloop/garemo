import { PageShell } from "@/components/layout/page-shell";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <PageShell title="Panel de Administrador">
      <AdminDashboardClient />
    </PageShell>
  );
}
