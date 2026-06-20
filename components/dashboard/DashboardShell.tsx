"use client";

import Link from "next/link";
import { LogOut, Store } from "lucide-react";

import { Button } from "@/components/ui/button";

type DashboardShellProps = {
  children: React.ReactNode;
  onSignOut: () => void;
  userEmail: string;
};

export function DashboardShell({
  children,
  onSignOut,
  userEmail,
}: DashboardShellProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium uppercase text-brand">
              Panel emprendedor
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Gestiona tu negocio
            </h1>
            <p className="text-sm text-muted">{userEmail}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-surface"
            href="/businesses"
          >
            Ver directorio
          </Link>
          <Button onClick={onSignOut} type="button" variant="secondary">
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
}
