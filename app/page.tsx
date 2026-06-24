import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  LogIn,
  MapPinned,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserPlus,
} from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { getActiveBusinesses, getCategories } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categoriesResult, businessesResult] = await Promise.all([
    getCategories(),
    getActiveBusinesses(),
  ]);
  const categories = categoriesResult.data;
  const businesses = businessesResult.data;
  const visibleBusinessCount = businesses.length;
  const mappedBusinessCount = businesses.filter(
    (business) =>
      typeof business.location?.latitude === "number" &&
      typeof business.location?.longitude === "number",
  ).length;

  return (
    <PageShell>
      <div className="space-y-10 pb-8">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <p className="inline-flex rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-brand">
                Directorio universitario local
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                Garemo conecta estudiantes con negocios cerca del campus.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted">
                Explora emprendimientos activos, revisa su ubicacion y abre el
                perfil publico para contactar por WhatsApp sin crear cuenta.
              </p>
            </div>

            <div className="grid gap-3 sm:flex">
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-teal-800"
                href="/businesses"
              >
                <Search className="h-4 w-4" />
                Explorar negocios
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-background"
                href="/map"
              >
                <MapPinned className="h-4 w-4" />
                Ver mapa
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-background"
                href="/login"
              >
                <LogIn className="h-4 w-4" />
                Iniciar sesion
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-background"
                href="/signup"
              >
                <UserPlus className="h-4 w-4" />
                Crear cuenta
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-background"
                href="/dashboard"
              >
                <Store className="h-4 w-4" />
                Publicar mi negocio
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center sm:max-w-md">
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-2xl font-semibold">{visibleBusinessCount}</p>
                <p className="text-xs leading-5 text-muted">negocios</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-2xl font-semibold">{categories.length}</p>
                <p className="text-xs leading-5 text-muted">categorias</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-2xl font-semibold">{mappedBusinessCount}</p>
                <p className="text-xs leading-5 text-muted">pines</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand">
                    Vista publica
                  </p>
                  <h2 className="text-lg font-semibold">
                    Negocios disponibles
                  </h2>
                </div>
                <MapPinned className="h-5 w-5 text-brand" />
              </div>

              <div className="space-y-3">
                {businesses.slice(0, 3).map((business) => (
                  <Link href={`/businesses/${business.id}`} key={business.id}>
                    <div className="rounded-lg border border-border bg-background p-3 transition-colors hover:border-brand">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {business.name}
                          </p>
                          <p className="text-xs text-muted">
                            {business.category?.name ?? "Categoria"}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-brand" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Card className="space-y-3">
            <Search className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold">Busca rapido</h2>
            <p className="text-sm leading-6 text-muted">
              Filtra por categoria y abre perfiles activos aprobados.
            </p>
          </Card>
          <Card className="space-y-3">
            <MapPinned className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold">Ubica en mapa</h2>
            <p className="text-sm leading-6 text-muted">
              Revisa pines y referencias para encontrar el negocio.
            </p>
          </Card>
          <Card className="space-y-3">
            <MessageCircle className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold">Contacta directo</h2>
            <p className="text-sm leading-6 text-muted">
              Usa WhatsApp desde el perfil publico cuando este disponible.
            </p>
          </Card>
        </section>

        <section className="grid gap-3 lg:grid-cols-3">
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-brand" />
              <h2 className="text-base font-semibold">Estudiantes</h2>
            </div>
            <p className="text-sm leading-6 text-muted">
              Puedes explorar negocios, productos, precios, mapa y WhatsApp sin
              crear cuenta. Si te registras como comprador, puedes guardar
              favoritos y calificar negocios.
            </p>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-background"
              href="/signup"
            >
              Crear cuenta comprador
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-brand" />
              <h2 className="text-base font-semibold">Emprendedores</h2>
            </div>
            <p className="text-sm leading-6 text-muted">
              Crea cuenta como vendedor para crear o editar tu negocio. Los
              negocios nuevos quedan en revision antes de aparecer publicamente.
            </p>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-background"
              href="/signup"
            >
              Publicar mi negocio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <h2 className="text-base font-semibold">Admin Garemo</h2>
            </div>
            <p className="text-sm leading-6 text-muted">
              Solo usuarios con rol admin activo pueden revisar negocios. Nadie
              puede elegir admin desde la interfaz publica.
            </p>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-background"
              href="/admin"
            >
              Revisar pendientes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase text-brand">
              Confianza
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Senales claras, sin prometer mas de lo que existe
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="space-y-3">
              <CheckCircle2 className="h-5 w-5 text-brand" />
              <h3 className="text-base font-semibold">
                Verificado por Garemo
              </h3>
              <p className="text-sm leading-6 text-muted">
                Badge manual para negocios revisados. No reemplaza confirmar
                detalles por WhatsApp antes de pagar.
              </p>
            </Card>
            <Card className="space-y-3">
              <Star className="h-5 w-5 text-brand" />
              <h3 className="text-base font-semibold">
                Calificaciones iniciales
              </h3>
              <p className="text-sm leading-6 text-muted">
                Usuarios autenticados pueden dejar una calificacion simple; los
                comentarios abusivos pueden moderarse.
              </p>
            </Card>
            <Card className="space-y-3">
              <Sparkles className="h-5 w-5 text-brand" />
              <h3 className="text-base font-semibold">
                Contactos generados
              </h3>
              <p className="text-sm leading-6 text-muted">
                Contamos clics a WhatsApp como senal de interes. No son ventas
                ni pagos procesados por Garemo.
              </p>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase text-brand">
                Categorias
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Explora por necesidad
              </h2>
            </div>
            <Link
              className="hidden text-sm font-medium text-brand sm:inline-flex"
              href="/businesses"
            >
              Ver todo
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                href={`/businesses?category=${category.slug}`}
                key={category.id}
              >
                <Card className="flex items-start gap-3 transition-colors hover:border-brand">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-brand">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{category.name}</h3>
                    <p className="line-clamp-2 text-sm leading-6 text-muted">
                      {category.description ?? "Negocios visibles en Garemo."}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold">
                Cuentas y roles en piloto
              </h2>
              <p className="text-sm leading-6 text-muted">
                Compradores pueden crear cuenta para guardar favoritos.
                Vendedores autenticados pueden crear/editar su negocio propio.
                Admin revisa negocios con RLS y funciones seguras antes de
                publicar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
