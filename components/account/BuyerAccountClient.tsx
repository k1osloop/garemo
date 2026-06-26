"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookmarkCheck,
  ExternalLink,
  LogOut,
  Search,
  ShieldAlert,
  Star,
  Store,
  UserRound,
  MapPin,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  ensureInitialUserProfile,
  getFullNameFromUser,
  getRequestedRoleFromUser,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BusinessReview, Favorite, UserProfile } from "@/types/database";

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

export function BuyerAccountClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<AccountFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<AccountReview[]>([]);
  const [role, setRole] = useState<string | null>(null);
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

    const { data: userResult, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userResult.user) {
      router.replace("/login");
      return;
    }

    setUserEmail(userResult.user.email ?? "Usuario autenticado");
    setUserId(userResult.user.id);

    const { data: appRole, error: roleError } =
      await supabase.rpc("current_app_role");

    if (roleError) {
      setError("No pudimos verificar tu rol de cuenta.");
      setIsLoading(false);
      return;
    }

    let resolvedRole = appRole;

    if (!resolvedRole) {
      const requestedRole = getRequestedRoleFromUser(userResult.user);

      if (requestedRole) {
        const { data: createdProfile } = await ensureInitialUserProfile(
          supabase,
          requestedRole,
          getFullNameFromUser(userResult.user),
        );

        resolvedRole = createdProfile?.role ?? null;
      }
    }

    setRole(resolvedRole);

    const { data: profileData } = await supabase
      .from("users_profile")
      .select("id,email,full_name,role,phone,status,created_at,updated_at")
      .eq("id", userResult.user.id)
      .maybeSingle();

    setProfile((profileData as UserProfile | null) ?? null);

    if (resolvedRole === "admin") {
      setIsLoading(false);
      return;
    }

    const [{ data: favoriteData, error: favoriteError }, { data: reviewData, error: reviewError }] =
      await Promise.all([
        supabase
          .from("favorites")
          .select(favoriteSelect)
          .eq("user_id", userResult.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("business_reviews")
          .select(reviewSelect)
          .eq("user_id", userResult.user.id)
          .order("created_at", { ascending: false }),
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

    setFavorites(
      ((favoriteData ?? []) as unknown as FavoriteRow[]).map(normalizeFavorite),
    );
    setReviews(
      ((reviewData ?? []) as unknown as ReviewRow[]).map(normalizeReview),
    );
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

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando tu cuenta...</p>
      </Card>
    );
  }

  if (role === "admin") {
    return (
      <ErrorState
        title="Cuenta admin"
        description="Esta vista es para compradores y emprendedores. Usa el panel admin para revisar negocios."
      />
    );
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorState title="No pudimos cargar la cuenta" description={error} /> : null}

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-brand/20 bg-brand/5 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20">
              <UserRound className="h-4 w-4 text-brand" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              Perfil comprador
            </p>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              {profile?.full_name ?? userEmail}
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {userEmail} • Rol: <span className="uppercase text-slate-600">{role === "owner" ? "emprendedor" : role ?? "sin perfil"}</span>
            </p>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            Guarda negocios para volver rápido y revisa tus calificaciones. Los
            favoritos son privados y no se usan como ranking público.
          </p>
        </div>
        <Button onClick={signOut} type="button" variant="outline" className="shrink-0 border-slate-300 hover:bg-slate-100 hover:text-slate-900">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
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
              description="Explora el directorio y toca el ícono de guardar en los negocios que quieras revisar después."
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
                          Ver negocio
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
