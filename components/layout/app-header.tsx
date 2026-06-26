"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Search, UserCircle, LogOut, ChevronDown } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function AppHeader() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase.rpc("current_app_role").then(({ data }) => {
          setRole(data);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        supabase.rpc("current_app_role").then(({ data }) => {
          setRole(data);
          setIsLoading(false);
        });
      } else {
        setRole(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex min-h-16 w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-brand transition-opacity hover:opacity-90"
          href="/"
        >
          <img src="/brand/icon.svg" alt="Garemo Logo" className="h-8 w-8 drop-shadow-sm" />
          <span>Garemo</span>
        </Link>
        <nav className="flex w-full flex-wrap items-center gap-1.5 text-sm font-medium text-muted-foreground sm:w-auto sm:justify-end">
          <Link
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-100 hover:text-foreground"
            href="/businesses"
          >
            <Search className="h-4 w-4" />
            Explorar
          </Link>
          <Link
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-100 hover:text-foreground"
            href="/map"
          >
            <MapPin className="h-4 w-4" />
            Mapa
          </Link>
          
          {isLoading ? (
            <div className="flex items-center gap-2 ml-2">
              <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-100"></div>
              <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100"></div>
            </div>
          ) : session ? (
            <div className="relative ml-2">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand shadow-sm"
              >
                <UserCircle className="h-4 w-4 text-brand" />
                <span>{role === 'owner' ? 'Emprendedor' : role === 'admin' ? 'Admin' : 'Comprador'}</span>
                <ChevronDown className="h-4 w-4 text-muted" />
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface py-1 shadow-md">
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Mi perfil
                  </Link>
                  {role === "admin" && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Administración
                    </Link>
                  )}
                  {role === "owner" && (
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Panel de mi negocio
                    </Link>
                  )}
                  {role === "buyer" && (
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Publicar mi negocio
                    </Link>
                  )}
                  <div className="my-1 border-t border-border"></div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100 hover:text-foreground"
                href="/login"
              >
                Entrar
              </Link>
              <Link
                className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-brand-foreground transition-all hover:bg-brand-hover shadow-sm"
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
