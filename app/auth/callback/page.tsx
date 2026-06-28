import { Suspense } from "react";

import { AuthCallbackClient } from "@/components/auth/AuthCallbackClient";
import { PageShell } from "@/components/layout/page-shell";

export default function AuthCallbackPage() {
  return (
    <PageShell title="Acceso seguro">
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-surface p-5 text-sm font-medium text-muted-foreground shadow-sm">
            Preparando acceso...
          </div>
        }
      >
        <AuthCallbackClient />
      </Suspense>
    </PageShell>
  );
}
