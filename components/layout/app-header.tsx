import Link from "next/link";
import { LogIn, MapPin, Search, Store, UserPlus } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          href="/"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
            G
          </span>
          <span>Garemo</span>
        </Link>
        <nav className="flex w-full flex-wrap items-center gap-1 text-sm font-medium text-muted sm:w-auto sm:justify-end">
          <Link
            className="rounded-lg px-2.5 py-2 transition-colors hover:bg-background hover:text-foreground"
            href="/"
          >
            Inicio
          </Link>
          <Link
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 transition-colors hover:bg-background hover:text-foreground"
            href="/businesses"
          >
            <Search className="hidden h-4 w-4 sm:block" />
            Directorio
          </Link>
          <Link
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 transition-colors hover:bg-background hover:text-foreground"
            href="/map"
          >
            <MapPin className="hidden h-4 w-4 sm:block" />
            Mapa
          </Link>
          <Link
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 transition-colors hover:bg-background hover:text-foreground"
            href="/login#crear-cuenta"
          >
            <UserPlus className="hidden h-4 w-4 sm:block" />
            Crear cuenta
          </Link>
          <Link
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 transition-colors hover:bg-background hover:text-foreground"
            href="/login"
          >
            <LogIn className="hidden h-4 w-4 sm:block" />
            Entrar
          </Link>
          <Link
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-2 text-brand-foreground transition-colors hover:bg-teal-800"
            href="/dashboard"
          >
            <Store className="hidden h-4 w-4 sm:block" />
            Publicar
          </Link>
        </nav>
      </div>
    </header>
  );
}
