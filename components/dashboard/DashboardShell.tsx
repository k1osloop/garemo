"use client";

import Link from "next/link";
import { Eye, LogOut, Store } from "lucide-react";

import { Button } from "@/components/ui/button";

type DashboardShellProps = {
  children: React.ReactNode;
  onSignOut: () => void;
  subtitle?: string;
  title?: string;
  userEmail: string;
};

export function DashboardShell({
  children,
  onSignOut,
  subtitle = "Panel emprendedor",
  title = "Gestiona tu negocio",
  userEmail,
}: DashboardShellProps) {
  return (
    <div className="mx-auto max-w-6xl min-w-0 space-y-6">
      <header className="overflow-hidden rounded-[1.75rem] border border-brand/10 bg-gradient-to-br from-white via-[#fffaf0] to-brand/10 shadow-sm">
        <div className="flex min-w-0 flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-sm">
              <Store className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-brand">
                {subtitle}
              </p>
              <h1 className="break-words text-2xl font-black tracking-tight sm:text-3xl">
                {title}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 text-sm font-extrabold transition-colors hover:bg-[#FFF4E2]"
              href="/businesses"
              prefetch={false}
            >
              <Eye className="h-4 w-4 text-brand" />
              Ver publico
            </Link>
            <Button
              className="rounded-2xl font-extrabold"
              onClick={onSignOut}
              type="button"
              variant="secondary"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
