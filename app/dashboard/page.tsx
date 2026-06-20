import { VendorDashboardClient } from "@/components/dashboard/VendorDashboardClient";
import { PageShell } from "@/components/layout/page-shell";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <PageShell title="Panel emprendedor">
      <VendorDashboardClient />
    </PageShell>
  );
}
