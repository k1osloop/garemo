import Link from "next/link";
import {
  ArrowRight,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  Clock3,
  MapPinned,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserCircle,
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
      <div className="min-w-0 space-y-10 pb-8">
        <section className="relative overflow-hidden rounded-[1.5rem] border border-brand/10 bg-gradient-to-br from-[#fffaf0] via-white to-brand/10 p-5 shadow-sm sm:rounded-3xl sm:p-10 lg:p-12">
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="min-w-0 space-y-6">
              <span className="inline-flex rounded-full border border-brand/20 bg-white px-4 py-1.5 text-sm font-extrabold text-brand shadow-sm">
                Compra talento universitario
              </span>
              <h1 className="text-3xl font-black leading-tight text-foreground sm:text-5xl">
                Encuentra emprendimientos cerca de tu universidad
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Apoya a la comunidad universitaria. Explora negocios, revisa el
                mapa de ubicaciones y contacta directo por WhatsApp sin
                intermediarios.
              </p>

              <div className="grid gap-3 sm:flex">
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-base font-extrabold text-brand-foreground shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-lg"
                  href="/businesses"
                  prefetch={false}
                >
                  <Search className="h-5 w-5" />
                  Explorar negocios
                </Link>
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-6 text-base font-extrabold text-foreground transition-all hover:border-brand/30 hover:bg-[#FFF4E2]"
                  href="/map"
                  prefetch={false}
                >
                  <MapPinned className="h-5 w-5 text-brand" />
                  Ver mapa
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] border border-border/70 bg-white p-4 shadow-sm">
              <div className="rounded-2xl bg-brand/10 p-3 text-center">
                <p className="text-3xl font-bold text-brand">
                  {visibleBusinessCount}
                </p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  Negocios
                </p>
              </div>
              <div className="rounded-2xl bg-accent/15 p-3 text-center">
                <p className="text-3xl font-bold text-brand">
                  {categories.length}
                </p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  Categorias
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-center">
                <p className="text-3xl font-bold text-brand">
                  {mappedBusinessCount}
                </p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  En el mapa
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { href: "/businesses", icon: Search, label: "Negocios" },
            { href: "/map", icon: MapPinned, label: "Mapa" },
            { href: "/account", icon: BookmarkCheck, label: "Favoritos" },
            { href: "/signup", icon: Store, label: "Publicar" },
            { href: "/login", icon: UserCircle, label: "Perfil" },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-3xl border border-border/70 bg-white p-3 text-center text-sm font-extrabold text-foreground shadow-sm transition-colors hover:border-brand/30 hover:bg-[#FFF4E2]"
                href={item.href}
                key={item.href}
                prefetch={false}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </section>

        <section className="grid min-w-0 gap-4 sm:grid-cols-3">
          <Card className="space-y-3 shadow-sm transition-colors hover:border-brand/30">
            <Search className="h-6 w-6 text-brand" />
            <h2 className="text-lg font-semibold">Busca rapido</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Filtra por categoria y descubre emprendimientos activos en la
              universidad.
            </p>
          </Card>
          <Card className="space-y-3 shadow-sm transition-colors hover:border-brand/30">
            <MapPinned className="h-6 w-6 text-brand" />
            <h2 className="text-lg font-semibold">Ubica en el mapa</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Revisa los pines en el mapa interactivo para encontrar los
              negocios fisicos.
            </p>
          </Card>
          <Card className="space-y-3 shadow-sm transition-colors hover:border-brand/30">
            <MessageCircle className="h-6 w-6 text-brand" />
            <h2 className="text-lg font-semibold">Contacta directo</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Abre WhatsApp con un clic para consultar sin comisiones ni
              registros.
            </p>
          </Card>
        </section>

        <section className="grid min-w-0 gap-4 pt-8 lg:grid-cols-3">
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
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-slate-50"
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
              negocios nuevos pasan por una revision rapida antes de aparecer
              en el directorio.
            </p>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover"
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
              Garemo no procesa pagos en linea. Verifica siempre con el
              emprendedor por WhatsApp antes de transferir dinero.
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
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
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
              <h3 className="text-base font-semibold">Contactos generados</h3>
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
              prefetch={false}
            >
              Ver todo
            </Link>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                href={`/businesses?category=${category.slug}`}
                key={category.id}
                prefetch={false}
              >
                <Card className="flex min-w-0 items-start gap-3 transition-colors hover:border-brand">
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
                Cuentas en piloto
              </h2>
              <p className="text-sm leading-6 text-muted">
                Compradores pueden guardar favoritos. Emprendedores
                autenticados pueden crear y editar su negocio propio. Las
                publicaciones pasan por una revision segura antes de aparecer.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
