import { RoleOnboardingClient } from "@/components/auth/RoleOnboardingClient";
import { PageShell } from "@/components/layout/page-shell";

export const dynamic = "force-dynamic";

export default function RoleOnboardingPage() {
  return (
    <PageShell>
      <RoleOnboardingClient />
    </PageShell>
  );
}
