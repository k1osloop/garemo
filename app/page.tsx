import Link from "next/link";
import {
  ArrowRight,
  MapPinned,
  Search,
  ShieldCheck,
  Star,
  Store,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Building2,
  Clock3,
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
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-brand/10 to-transparent p-6 sm:p-12 lg:p-16 border border-border/50 shadow-sm">
          <div className="absolute inset-0 bg-[url('https://placehold.co/100x100/png?text=pattern')] opacity-5 mix-blend-overlay"></div>
          <div className="relative mx-auto max-w-3xl space-y-8 text-center">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-brand/20 bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm">
                Directorio universitario local
              </span>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Encuentra emprendimientos y productos cerca de tu universidad
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
                Apoya a la comunidad universitaria. Explora negocios, revisa el mapa de ubicaciones y contacta directo por WhatsApp sin intermediarios.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand px-8 text-base font-medium text-brand-foreground shadow-md transition-all hover:bg-brand-hover hover:shadow-lg hover:-translate-y-0.5"
                href="/businesses"
              >
                <Search className="h-5 w-5" />
                Explorar negocios
              </Link>
              <Link
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface px-8 text-base font-medium text-foreground transition-all hover:border-brand/30 hover:bg-slate-50"
                href="/signup"
              >
                <Store className="h-5 w-5 text-brand" />
                Publicar mi negocio
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 sm:max-w-xl mx-auto border-t border-border/50">
              <div className="flex flex-col items-center">
                <p className="text-3xl font-bold text-brand">{visibleBusinessCount}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Negocios</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-3xl font-bold text-brand">{categories.length}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Categorías</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-3xl font-bold text-brand">{mappedBusinessCount}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">En el mapa</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3 mt-12">
          <Card className="space-y-3 hover:border-brand/30 transition-colors shadow-sm">
            <Search className="h-6 w-6 text-brand" />
            <h2 className="text-lg font-semibold">Busca rápido</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Filtra por categoría y descubre emprendimientos activos en la universidad.
            </p>
          </Card>
          <Card className="space-y-3 hover:border-brand/30 transition-colors shadow-sm">
            <MapPinned className="h-6 w-6 text-brand" />
            <h2 className="text-lg font-semibold">Ubica en el mapa</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Revisa los pines en el mapa interactivo para encontrar los negocios físicos.
            </p>
          </Card>
          <Card className="space-y-3 hover:border-brand/30 transition-colors shadow-sm">
            <MessageCircle className="h-6 w-6 text-brand" />
            <h2 className="text-lg font-semibold">Contacta directo</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Abre WhatsApp con un clic para hacer pedidos sin comisiones ni registros.
            </p>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3 pt-8">
          <Card className="space-y-4 border-t-4 border-t-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-800" />
              <h2 className="text-xl font-semibold">Estudiantes</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Puedes explorar negocios, productos, precios, mapa y WhatsApp sin
              crear cuenta. Si te registras como comprador, puedes guardar
              favoritos y calificar negocios.
            </p>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-slate-50 transition-colors"
              href="/signup"
            >
              Crear cuenta comprador
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
          
          <Card className="space-y-4 border-t-4 border-t-brand shadow-sm">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-brand" />
              <h2 className="text-xl font-semibold">Emprendedores</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Crea tu perfil como emprendedor para publicar tu negocio. Los
              negocios nuevos pasan por una revisión rápida antes de aparecer en el directorio.
            </p>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand-hover transition-colors"
              href="/signup"
            >
              Publicar mi negocio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
          
          <Card className="space-y-4 border-t-4 border-t-slate-300 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-600" />
              <h2 className="text-xl font-semibold">Garemo Seguro</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Garemo no procesa pagos en línea. Verifica siempre con el emprendedor por WhatsApp antes de transferir dinero.
            </p>
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
                Emprendedores autenticados pueden crear/editar su negocio propio.
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
