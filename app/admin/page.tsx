import { AdminReviewClient } from "@/components/admin/AdminReviewClient";
import { PageShell } from "@/components/layout/page-shell";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <PageShell title="Revision admin">
      <AdminReviewClient />
    </PageShell>
  );
}
