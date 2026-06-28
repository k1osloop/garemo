import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { SiteFooter } from "@/components/layout/site-footer";

type PageShellProps = {
  children: ReactNode;
  title?: string;
};

export function PageShell({ children, title }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:py-8">
        {title ? (
          <h1 className="mb-4 text-2xl font-semibold tracking-tight">
            {title}
          </h1>
        ) : null}
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
