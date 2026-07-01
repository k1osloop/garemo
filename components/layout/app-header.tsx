"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { BrandLogo } from "@/components/layout/brand-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        !mobileMenuRef.current?.contains(target) &&
        !desktopMenuRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", closeOnOutsideClick);

    return () => window.removeEventListener("mousedown", closeOnOutsideClick);
  }, [menuOpen]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.replace("/");
  };

  const roleLabel =
    role === "owner"
      ? "Emprendedor"
      : role === "admin"
        ? "Administrador"
        : "Comprador";
  const hideMobileTopNav =
    pathname.startsWith("/account") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding");

  return (
    <header className="sticky top-0 z-50 border-b border-brand/10 bg-[#fffaf0]/95 shadow-[0_8px_24px_rgba(11,31,61,0.08)] backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-7xl gap-2 px-3 py-2 sm:flex sm:min-h-16 sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <BrandLogo showSlogan className="shrink-0" />
          <div className="relative shrink-0 sm:hidden" ref={mobileMenuRef}>
            {isLoading ? (
              <LoadingAccountPill />
            ) : session ? (
              <UserMenuButton
                menuOpen={menuOpen}
                roleLabel={roleLabel}
                onToggle={() => setMenuOpen((isOpen) => !isOpen)}
              />
            ) : (
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand px-4 text-sm font-extrabold text-brand-foreground shadow-sm"
                href="/login"
              >
                Entrar
              </Link>
            )}

            {session && menuOpen ? (
              <UserDropdown
                isMobile
                onSignOut={handleSignOut}
                role={role}
                setMenuOpen={setMenuOpen}
              />
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-0 items-center justify-between gap-2 sm:flex sm:justify-end",
            hideMobileTopNav && "hidden",
          )}
        >
          <nav className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:flex sm:flex-none sm:items-center sm:gap-1.5">
            <NavPill href="/businesses" icon={Search} label="Explorar" />
            <NavPill href="/map" icon={MapPin} label="Mapa" />
          </nav>

          <div className="relative hidden shrink-0 sm:block" ref={desktopMenuRef}>
            {isLoading ? (
              <LoadingAccountPill />
            ) : session ? (
              <UserMenuButton
                menuOpen={menuOpen}
                roleLabel={roleLabel}
                onToggle={() => setMenuOpen((isOpen) => !isOpen)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
                  href="/login"
                >
                  Entrar
                </Link>
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand px-4 text-sm font-extrabold text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover"
                  href="/signup"
                >
                  Crear cuenta
                </Link>
              </div>
            )}

            {session && menuOpen ? (
              <UserDropdown
                onSignOut={handleSignOut}
                role={role}
                setMenuOpen={setMenuOpen}
              />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavPill({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-2xl bg-white px-3 text-sm font-extrabold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-brand hover:text-brand-foreground sm:bg-transparent sm:shadow-none sm:ring-0 sm:hover:bg-white sm:hover:text-brand"
      href={href}
      prefetch={false}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function LoadingAccountPill() {
  return (
    <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand/10 bg-white px-3 text-sm font-extrabold text-muted-foreground shadow-sm">
      <span className="flex h-7 w-7 shrink-0 animate-pulse items-center justify-center rounded-full bg-brand/10 text-brand">
        <UserCircle className="h-4 w-4" />
      </span>
      <span>Cuenta</span>
    </div>
  );
}

function UserMenuButton({
  menuOpen,
  onToggle,
  roleLabel,
}: {
  menuOpen: boolean;
  onToggle: () => void;
  roleLabel: string;
}) {
  return (
    <button
      aria-expanded={menuOpen}
      className="inline-flex min-h-10 max-w-[10rem] items-center gap-2 rounded-full border border-brand/15 bg-white px-2.5 text-sm font-extrabold text-foreground shadow-sm transition-colors hover:border-brand/30"
      onClick={onToggle}
      type="button"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <UserCircle className="h-4 w-4" />
      </span>
      <span className="truncate">{roleLabel}</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function UserDropdown({
  isMobile = false,
  onSignOut,
  role,
  setMenuOpen,
}: {
  isMobile?: boolean;
  onSignOut: () => void;
  role: string | null;
  setMenuOpen: (value: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "absolute z-50 mt-2 w-64 overflow-hidden rounded-3xl border border-border bg-white p-2 shadow-2xl",
        isMobile ? "right-0" : "right-0",
      )}
    >
      <DropdownLink
        href="/account"
        icon={UserCircle}
        label="Mi perfil"
        setMenuOpen={setMenuOpen}
      />
      {role === "owner" ? (
        <DropdownLink
          href="/dashboard"
          icon={Store}
          label="Panel de mi negocio"
          setMenuOpen={setMenuOpen}
        />
      ) : null}
      {role === "admin" ? (
        <DropdownLink
          href="/admin"
          icon={ShieldCheck}
          label="Panel administrador"
          setMenuOpen={setMenuOpen}
        />
      ) : null}
      {role === "buyer" ? (
        <DropdownLink
          href="/dashboard"
          icon={Store}
          label="Publicar negocio"
          setMenuOpen={setMenuOpen}
        />
      ) : null}
      <div className="my-2 border-t border-border" />
      <button
        className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
        onClick={onSignOut}
        type="button"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesion
      </button>
    </div>
  );
}

function DropdownLink({
  href,
  icon: Icon,
  label,
  setMenuOpen,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  setMenuOpen: (value: boolean) => void;
}) {
  return (
    <Link
      className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-foreground transition-colors hover:bg-[#FFF4E2]"
      href={href}
      onClick={() => setMenuOpen(false)}
      prefetch={false}
    >
      <Icon className="h-4 w-4 text-brand" />
      {label}
    </Link>
  );
}
