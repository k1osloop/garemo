import type { ReactNode } from "react";

import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { AppHeader } from "@/components/layout/app-header";
import { SiteFooter } from "@/components/layout/site-footer";

type PageShellProps = {
  children: ReactNode;
  title?: string;
};

export function PageShell({ children, title }: PageShellProps) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-3 pb-24 pt-5 sm:px-4 sm:pb-8 sm:pt-8">
        {title ? (
          <h1 className="mb-4 text-2xl font-semibold tracking-tight">
            {title}
          </h1>
        ) : null}
        {children}
      </main>
      <SiteFooter />
      <AppBottomNav />
    </div>
  );
}
