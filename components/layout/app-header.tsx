"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, MapPin, Search, UserCircle } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { BrandLogo } from "@/components/layout/brand-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AppHeader() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const readRole = async (currentSession: Session | null) => {
      setSession(currentSession);

      if (!currentSession) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase.rpc("current_app_role");
      setRole(data);
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => readRole(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      readRole(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.replace("/");
  };

  const roleLabel =
    role === "owner" ? "Emprendedor" : role === "admin" ? "Admin" : "Comprador";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[#fffaf0]/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <BrandLogo className="shrink-0" />
          <span className="hidden rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-foreground md:inline-flex">
            Compra talento universitario
          </span>
        </div>

        <nav className="flex w-full max-w-full items-center gap-1.5 overflow-x-auto pb-1 text-sm font-medium text-muted-foreground sm:w-auto sm:justify-end sm:overflow-visible sm:pb-0">
          <Link
            className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-foreground"
            href="/businesses"
            prefetch={false}
          >
            <Search className="h-4 w-4" />
            Explorar
          </Link>
          <Link
            className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-foreground"
            href="/map"
            prefetch={false}
          >
            <MapPin className="h-4 w-4" />
            Mapa
          </Link>

          {isLoading ? (
            <div className="ml-1 flex shrink-0 items-center gap-2">
              <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : session ? (
            <div className="relative ml-1 shrink-0">
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                onClick={() => setMenuOpen((isOpen) => !isOpen)}
                type="button"
              >
                <UserCircle className="h-4 w-4 text-brand" />
                <span>{roleLabel}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface py-1 shadow-lg">
                  <Link
                    className="block px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    prefetch={false}
                  >
                    Mi perfil
                  </Link>
                  {role === "admin" ? (
                    <Link
                      className="block px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      prefetch={false}
                    >
                      Administracion
                    </Link>
                  ) : null}
                  {role === "owner" ? (
                    <Link
                      className="block px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      prefetch={false}
                    >
                      Panel de mi negocio
                    </Link>
                  ) : null}
                  {role === "buyer" ? (
                    <Link
                      className="block px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      prefetch={false}
                    >
                      Publicar mi negocio
                    </Link>
                  ) : null}
                  <div className="my-1 border-t border-border" />
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    onClick={handleSignOut}
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesion
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="ml-1 flex shrink-0 items-center gap-2">
              <Link
                className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-foreground"
                href="/login"
              >
                Entrar
              </Link>
              <Link
                className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-brand px-3 py-2 text-brand-foreground shadow-sm transition-all hover:bg-brand-hover"
                href="/signup"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
