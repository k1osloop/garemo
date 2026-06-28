import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <BrandLogo />
            <p className="text-sm font-medium text-brand/80">
              Compra talento universitario
            </p>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              El directorio universitario para descubrir emprendimientos
              locales, comprar sin comisiones y apoyar el talento de tu
              comunidad.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-foreground">
              Plataforma
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                  href="/businesses"
                  prefetch={false}
                >
                  Explorar
                </Link>
              </li>
              <li>
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                  href="/map"
                  prefetch={false}
                >
                  Mapa
                </Link>
              </li>
              <li>
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                  href="/signup"
                >
                  Publicar mi negocio
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-foreground">
              Soporte
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                  href="mailto:soporte@garemo.online"
                >
                  Contacto
                </a>
              </li>
              <li>
                <a
                  className="text-sm font-medium text-red-600 transition-colors hover:text-red-500"
                  href="mailto:reportes@garemo.online"
                >
                  Reportar problema
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Garemo. Todos los derechos
            reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Hecho para comprar talento universitario.
          </p>
        </div>
      </div>
    </footer>
  );
}
