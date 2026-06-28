"use client";

import Link from "next/link";
import { LogOut, Store } from "lucide-react";

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
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="overflow-hidden rounded-[2rem] border border-border/70 bg-surface shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-sm">
            <Store className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-brand">
              {subtitle}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-bold transition-colors hover:bg-surface"
            href="/businesses"
          >
            Ver publico
          </Link>
          <Button onClick={onSignOut} type="button" variant="secondary">
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
