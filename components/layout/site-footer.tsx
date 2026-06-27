import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-surface mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/brand/icon.svg" alt="Garemo Logo" className="h-8 w-8 drop-shadow-sm" />
              <span className="text-xl font-bold tracking-tight text-brand">Garemo</span>
            </Link>
            <p className="text-sm font-medium text-brand/80">Compra talento universitario</p>
            <p className="text-sm text-muted-foreground leading-6 max-w-xs">
              El directorio universitario para descubrir emprendimientos locales, comprar sin comisiones y apoyar el talento de tu comunidad.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Plataforma</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/businesses" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                  Explorar
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                  Mapa
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                  Publicar mi negocio
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Soporte</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:soporte@garemo.online" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                  Contacto
                </a>
              </li>
              <li>
                <a href="mailto:reportes@garemo.online" className="text-sm text-red-600 hover:text-red-500 transition-colors font-medium">
                  Reportar problema
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Garemo. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-muted-foreground">Construido con <span className="text-brand">♥</span> por Garemo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
