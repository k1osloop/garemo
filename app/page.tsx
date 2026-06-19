import Link from "next/link";
import { MapPin, Search, Store } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <PageShell>
      <section className="space-y-6 py-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-brand">Sprint 0 placeholder</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Encuentra negocios y emprendimientos cerca de tu U.
          </h1>
          <p className="text-base leading-7 text-muted">
            Garemo prepara su MVP como directorio universitario mobile-first.
            Esta pantalla todavia no conecta datos reales.
          </p>
        </div>

        <div className="grid gap-3">
          <Link href="/businesses">
            <Button className="w-full justify-start">
              <Search className="h-4 w-4" />
              Explorar directorio placeholder
            </Button>
          </Link>
          <Link href="/map">
            <Button className="w-full justify-start" variant="secondary">
              <MapPin className="h-4 w-4" />
              Ver mapa placeholder
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="w-full justify-start" variant="secondary">
              <Store className="h-4 w-4" />
              Panel emprendedor placeholder
            </Button>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
