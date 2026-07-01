"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookmarkCheck,
  Bell,
  CheckCheck,
  ExternalLink,
  LogOut,
  Search,
  ShieldAlert,
  Star,
  Store,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  getCurrentUserProfile,
  getPostLoginRedirect,
  roleDescriptions,
  roleLabels,
  roleProfileTitles,
  type AppRole,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  BusinessReview,
  Favorite,
  UserNotification,
  UserProfile,
} from "@/types/database";
type FavoriteBusiness = {
  id: string;
  name: string;
  description: string;
  status: string;
  is_verified: boolean;
  category?: { name: string; slug: string } | { name: string; slug: string }[] | null;
  location?:
    | { address_text: string; campus_zone: string | null }
    | { address_text: string; campus_zone: string | null }[]
    | null;
};
type FavoriteRow = Favorite & {
  business?: FavoriteBusiness | FavoriteBusiness[] | null;
};
type AccountFavorite = Favorite & {
  business: {
    id: string;
    name: string;
    description: string;
    is_verified: boolean;
    categoryName: string;
    locationLabel: string;
  } | null;
};
type ReviewBusiness = {
  id: string;
  name: string;
  status: string;
};
type ReviewRow = BusinessReview & {
  business?: ReviewBusiness | ReviewBusiness[] | null;
};
type AccountReview = BusinessReview & {
  business: ReviewBusiness | null;
};
function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}
function normalizeFavorite(row: FavoriteRow): AccountFavorite {
  const business = firstOrNull(row.business);
  const category = firstOrNull(business?.category);
  const location = firstOrNull(business?.location);
  return {
    ...row,
    business: business
      ? {
          id: business.id,
          name: business.name,
          description: business.description,
          is_verified: business.is_verified,
          categoryName: category?.name ?? "Categoria",
          locationLabel:
            location?.campus_zone ??
            location?.address_text ??
            "Ubicacion por confirmar",
        }
      : null,
  };
}
function normalizeReview(row: ReviewRow): AccountReview {
  return {
    ...row,
    business: firstOrNull(row.business),
  };
}
const favoriteSelect = `
  id,
  user_id,
  business_id,
  created_at,
  updated_at,
  business:businesses (
    id,
    name,
    description,
    status,
    is_verified,
    category:categories (
      name,
      slug
    ),
    location:locations (
      address_text,
      campus_zone
    )
  )
`;
const reviewSelect = `
  id,
  business_id,
  user_id,
  rating,
  comment,
  status,
  moderation_notes,
  created_at,
  updated_at,
  business:businesses (
    id,
    name,
    status
  )
`;

const notificationSelect = `
  id,
  user_id,
  business_id,
  type,
  title,
  message,
  status,
  metadata,
  created_at,
  read_at
`;

export function BuyerAccountClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<AccountFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<AccountReview[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [role, setRole] = useState<AppRole | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isBecomingOwner, setIsBecomingOwner] = useState(false);
  const handleBecomeOwner = async () => {
    setIsBecomingOwner(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("become_owner");
    
    if (rpcError) {
      setError("Hubo un problema al cambiar tu cuenta. Intenta nuevamente.");
      setIsBecomingOwner(false);
      return;
    }
    
    router.push("/dashboard");
  };
  const loadAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { error: profileReadError, profile: accountProfile, user } =
      await getCurrentUserProfile(supabase);
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profileReadError) {
      setError("No pudimos revisar tu perfil de cuenta.");
      setIsLoading(false);
      return;
    }
    if (!accountProfile || accountProfile.onboarding_completed === false) {
      router.replace(getPostLoginRedirect(accountProfile));
      return;
    }
    const resolvedRole = accountProfile.role;
    setUserEmail(user.email ?? accountProfile.email ?? "Usuario autenticado");
    setUserId(user.id);
    setRole(resolvedRole);
    setProfile(accountProfile as UserProfile);
    if (resolvedRole === "admin") {
      setIsLoading(false);
      return;
    }
    const [
      { data: favoriteData, error: favoriteError },
      { data: reviewData, error: reviewError },
      { data: notificationData, error: notificationError },
    ] =
      await Promise.all([
        supabase
          .from("favorites")
          .select(favoriteSelect)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("business_reviews")
          .select(reviewSelect)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_notifications")
          .select(notificationSelect)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
    if (favoriteError) {
      setError("No pudimos cargar tus favoritos. Revisa que el SQL de Sprint 3D este aplicado.");
      setIsLoading(false);
      return;
    }
    if (reviewError) {
      setError("No pudimos cargar tu historial de calificaciones.");
      setIsLoading(false);
      return;
    }
    if (notificationError) {
      setError("No pudimos cargar tus notificaciones. Revisa que el SQL de moderacion este aplicado.");
      setIsLoading(false);
      return;
    }
    setFavorites(
      ((favoriteData ?? []) as unknown as FavoriteRow[]).map(normalizeFavorite),
    );
    setReviews(
      ((reviewData ?? []) as unknown as ReviewRow[]).map(normalizeReview),
    );
    setNotifications((notificationData ?? []) as UserNotification[]);
    setIsLoading(false);
  }, [router, supabase]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccount();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAccount]);
  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError("No pudimos cerrar sesion. Intenta nuevamente.");
      return;
    }
    router.replace("/login");
  }
  async function removeFavorite(favoriteId: string) {
    setError(null);
    const { error: deleteError } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId)
      .eq("user_id", userId);
    if (deleteError) {
      setError("No pudimos quitar este favorito.");
      return;
    }
    setFavorites((current) =>
      current.filter((favorite) => favorite.id !== favoriteId),
    );
  }

  async function markNotificationRead(notificationId: string) {
    setError(null);
    const { error: markError } = await supabase.rpc("mark_notification_read", {
      notification_id: notificationId,
    });

    if (markError) {
      setError("No pudimos marcar la notificacion como leida.");
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              status: "read",
              read_at: notification.read_at ?? new Date().toISOString(),
            }
          : notification,
      ),
    );
  }

  async function markAllNotificationsRead() {
    setError(null);
    const { error: markError } = await supabase.rpc(
      "mark_all_my_notifications_read",
    );

    if (markError) {
      setError("No pudimos marcar tus notificaciones como leidas.");
      return;
    }

    const now = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        status: "read",
        read_at: notification.read_at ?? now,
      })),
    );
  }
  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando tu cuenta...</p>
      </Card>
    );
  }
  const safeRole = role ?? "buyer";
  const displayName = profile?.full_name ?? userEmail;
  const roleLabel = roleLabels[safeRole];
  const roleTitle = roleProfileTitles[safeRole];
  const roleDescription = roleDescriptions[safeRole];
  const unreadNotifications = notifications.filter(
    (notification) => notification.status === "unread",
  ).length;
  return (
    <div className="space-y-6">
      {error ? <ErrorState title="No pudimos cargar la cuenta" description={error} /> : null}
      <Card className="flex flex-col gap-5 overflow-hidden rounded-[1.75rem] border-brand/20 bg-gradient-to-br from-white via-[#fffaf0] to-brand/10 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-lg font-black uppercase text-brand-foreground shadow-sm">
              {displayName.slice(0, 1)}
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              {roleTitle}
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-brand shadow-sm ring-1 ring-brand/15">
              {roleLabel}
            </span>
          </div>
          <div>
            <h1 className="break-words text-3xl font-black tracking-tight text-slate-800">
              {displayName}
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {userEmail}
            </p>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            {roleDescription}
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-row">
          {role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2 text-sm font-extrabold text-brand-foreground shadow transition-colors hover:bg-brand/90"
            >
              Panel administrador
            </Link>
          )}
          {role === "owner" && (
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2 text-sm font-extrabold text-brand-foreground shadow transition-colors hover:bg-brand/90"
            >
              Panel de mi negocio
            </Link>
          )}
          {role === "buyer" && (
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-brand bg-white px-4 py-2 text-sm font-extrabold text-brand shadow-sm transition-colors hover:bg-brand/10"
            >
              Publicar mi negocio
            </Link>
          )}
          <Button onClick={signOut} type="button" variant="outline" className="shrink-0 rounded-2xl border-slate-300 font-extrabold hover:bg-slate-100 hover:text-slate-900">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="rounded-3xl bg-white shadow-sm">
          <BookmarkCheck className="mb-3 h-5 w-5 text-brand" />
          <p className="text-2xl font-black text-foreground">
            {favorites.length}
          </p>
          <p className="text-xs font-bold text-muted-foreground">Favoritos</p>
        </Card>
        <Card className="rounded-3xl bg-white shadow-sm">
          <Star className="mb-3 h-5 w-5 text-accent" />
          <p className="text-2xl font-black text-foreground">
            {reviews.length}
          </p>
          <p className="text-xs font-bold text-muted-foreground">Reseñas</p>
        </Card>
        <Card className="rounded-3xl bg-white shadow-sm">
          <Store className="mb-3 h-5 w-5 text-brand" />
          <p className="text-sm font-black text-foreground">Publicar</p>
          <p className="text-xs font-bold text-muted-foreground">
            Negocio propio
          </p>
        </Card>
        <Card className="rounded-3xl bg-white shadow-sm">
          <ShieldAlert className="mb-3 h-5 w-5 text-amber-500" />
          <p className="text-2xl font-black text-foreground">
            {unreadNotifications}
          </p>
          <p className="text-xs font-bold text-muted-foreground">
            Notificaciones
          </p>
        </Card>
      </div>

      <Card className="space-y-4 rounded-3xl bg-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Bell className="h-5 w-5 text-brand" />
              Notificaciones
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Avisos importantes sobre tu cuenta, negocio y reportes.
            </p>
          </div>
          {unreadNotifications > 0 ? (
            <Button
              className="gap-2 rounded-2xl"
              onClick={() => void markAllNotificationsRead()}
              type="button"
              variant="outline"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todo como leido
            </Button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            title="No tienes notificaciones nuevas"
            description="Cuando Garemo revise tu negocio o un reporte importante, lo veras aqui."
          />
        ) : (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <article
                className={cn(
                  "rounded-2xl border p-4",
                  notification.status === "unread"
                    ? "border-brand/20 bg-brand/5"
                    : "border-slate-100 bg-slate-50",
                )}
                key={notification.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-800">
                        {notification.title}
                      </h3>
                      {notification.status === "unread" ? (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-black uppercase text-brand-foreground">
                          Nueva
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
                          Leida
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {new Date(notification.created_at).toLocaleDateString("es-BO")}
                    </p>
                  </div>
                  {notification.status === "unread" ? (
                    <Button
                      className="shrink-0"
                      onClick={() => void markNotificationRead(notification.id)}
                      type="button"
                      variant="outline"
                    >
                      Marcar leida
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
      {role === "owner" ? (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-slate-200 bg-white shadow-sm">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Store className="h-5 w-5 text-brand" />
              También eres emprendedor
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Puedes administrar tu negocio público y productos desde el dashboard. 
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-brand-foreground hover:bg-brand-hover shadow-sm transition-all"
            href="/dashboard"
          >
            Ir al dashboard
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Card>
      ) : null}
      {role === "buyer" ? (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-brand/5 border-brand/20">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-800">
              ¿Tienes un emprendimiento?
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Convierte tu cuenta a Emprendedor y publica tu negocio gratis en el directorio.
            </p>
          </div>
          <Button
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-brand-foreground hover:bg-brand-hover shadow-sm transition-all"
            disabled={isBecomingOwner}
            onClick={handleBecomeOwner}
          >
            {isBecomingOwner ? "Actualizando..." : "Convertirme en Emprendedor"}
            <Store className="h-4 w-4" />
          </Button>
        </Card>
      ) : null}
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <BookmarkCheck className="h-5 w-5 text-brand" />
                Negocios guardados
              </h2>
            </div>
            <Link
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
              href="/businesses"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              Explorar
            </Link>
          </div>
          {favorites.length === 0 ? (
            <EmptyState
              title="Aún no guardaste negocios"
              description="Explora emprendimientos y guarda los que mas te interesen para volver rapido desde tu perfil."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {favorites.map((favorite) => (
                <Card className="flex flex-col space-y-4 hover:border-brand/30 transition-colors shadow-sm bg-white" key={favorite.id}>
                  {favorite.business ? (
                    <>
                      <div className="space-y-1.5 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 inline-block px-2 py-0.5 rounded">
                          {favorite.business.categoryName}
                        </p>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">
                          {favorite.business.name}
                        </h3>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {favorite.business.description}
                        </p>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-2">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{favorite.business.locationLabel}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <Link
                          className="flex-1 inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                          href={`/businesses/${favorite.business.id}`}
                        >
                          Ver perfil
                        </Link>
                        <Button
                          onClick={() => void removeFavorite(favorite.id)}
                          type="button"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold h-9 px-3"
                        >
                          Quitar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic my-auto">
                      Este negocio ya no está disponible.
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
        <section className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Star className="h-5 w-5 text-brand" />
              Tus reseñas
            </h2>
            <p className="text-sm leading-6 text-muted-foreground mt-1">
              Historial de calificaciones dejadas.
            </p>
          </div>
          {reviews.length === 0 ? (
            <EmptyState
              title="Sin calificaciones"
              description="Cuando dejes una calificación visible, aparecerá aquí."
            />
          ) : (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <Card className="space-y-3 shadow-sm bg-white" key={review.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">
                        {review.business?.name ?? "Negocio no disponible"}
                      </p>
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-amber-400" : "text-slate-200 fill-slate-200")} />
                        ))}
                      </div>
                    </div>
                    {review.business ? (
                      <Link
                        className="inline-flex items-center text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
                        href={`/businesses/${review.business.id}`}
                      >
                        Ver negocio
                      </Link>
                    ) : null}
                  </div>
                  {review.comment ? (
                    <p className="text-sm leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
      <Card className="flex items-start gap-4 border-l-4 border-l-amber-400 bg-amber-50/50 p-5">
        <ShieldAlert className="mt-0.5 h-6 w-6 text-amber-500 shrink-0" />
        <div className="space-y-1 text-amber-900">
          <h3 className="font-bold text-sm">Garemo es un directorio seguro</h3>
          <p className="text-sm leading-relaxed">
            No procesamos pagos ni pedidos directos. Usa los favoritos para organizarte y siempre confirma disponibilidad y precios por WhatsApp antes de transferir dinero.
          </p>
        </div>
      </Card>
    </div>
  );
}
