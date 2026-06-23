import { BuyerAccountClient } from "@/components/account/BuyerAccountClient";
import { PageShell } from "@/components/layout/page-shell";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <PageShell title="Mi cuenta">
      <BuyerAccountClient />
    </PageShell>
  );
}
