import { Suspense } from "react";

import { GoogleRedirectCompleteClient } from "@/components/auth/GoogleRedirectCompleteClient";
import { PageShell } from "@/components/layout/page-shell";

export default function GoogleCompletePage() {
  return (
    <PageShell title="Acceso con Google">
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-surface p-5 text-sm font-medium text-muted-foreground shadow-sm">
            Completando acceso con Google...
          </div>
        }
      >
        <GoogleRedirectCompleteClient />
      </Suspense>
    </PageShell>
  );
}
