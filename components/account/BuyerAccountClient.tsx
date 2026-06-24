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
} from "lucide-react";

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
        description="Esta vista es para compradores y vendedores. Usa el panel admin para revisar negocios."
      />
    );
  }

  return (
    <div className="space-y-5">
      {error ? <ErrorState title="No pudimos cargar la cuenta" description={error} /> : null}

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-brand" />
            <p className="text-sm font-medium uppercase text-brand">
              Perfil comprador
            </p>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile?.full_name ?? userEmail}
            </h1>
            <p className="mt-1 text-sm leading-6 text-muted">
              {userEmail} - rol {role ?? "sin perfil"}
            </p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Guarda negocios para volver rapido y revisa tus calificaciones. Los
            favoritos son privados y no se usan como ranking publico en esta
            etapa.
          </p>
        </div>
        <Button onClick={signOut} type="button" variant="secondary">
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </Button>
      </Card>

      {role === "owner" ? (
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Store className="h-4 w-4 text-brand" />
              Tambien eres vendedor
            </h2>
            <p className="text-sm leading-6 text-muted">
              Puedes administrar tu negocio desde el dashboard. Tus favoritos
              siguen siendo privados como usuario autenticado.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-teal-800"
            href="/dashboard"
          >
            Ir al dashboard
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Card>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookmarkCheck className="h-5 w-5 text-brand" />
              Negocios favoritos
            </h2>
            <p className="text-sm leading-6 text-muted">
              Solo tu cuenta puede ver y modificar esta lista.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface"
            href="/businesses"
          >
            <Search className="h-4 w-4" />
            Explorar negocios
          </Link>
        </div>

        {favorites.length === 0 ? (
          <EmptyState
            title="Aun no guardaste negocios"
            description="Explora el directorio y toca Guardar en los negocios que quieras revisar despues."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {favorites.map((favorite) => (
              <Card className="space-y-3" key={favorite.id}>
                {favorite.business ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase text-brand">
                        {favorite.business.categoryName}
                      </p>
                      <h3 className="text-base font-semibold">
                        {favorite.business.name}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-6 text-muted">
                        {favorite.business.description}
                      </p>
                      <p className="text-sm text-muted">
                        {favorite.business.locationLabel}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface"
                        href={`/businesses/${favorite.business.id}`}
                      >
                        Ver negocio
                      </Link>
                      <Button
                        onClick={() => void removeFavorite(favorite.id)}
                        type="button"
                        variant="secondary"
                      >
                        Quitar
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    Este favorito ya no esta disponible publicamente.
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Star className="h-5 w-5 text-brand" />
            Calificaciones dadas
          </h2>
          <p className="text-sm leading-6 text-muted">
            Historial visible de las calificaciones que dejaste en negocios
            publicos.
          </p>
        </div>

        {reviews.length === 0 ? (
          <EmptyState
            title="Aun no calificaste negocios"
            description="Cuando dejes una calificacion visible, aparecera aqui."
          />
        ) : (
          <div className="grid gap-3">
            {reviews.map((review) => (
              <Card className="space-y-2" key={review.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {review.business?.name ?? "Negocio no disponible"}
                    </p>
                    <p className="text-sm text-brand">
                      {review.rating}/5 estrellas
                    </p>
                  </div>
                  {review.business ? (
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface"
                      href={`/businesses/${review.business.id}`}
                    >
                      Ver negocio
                    </Link>
                  ) : null}
                </div>
                {review.comment ? (
                  <p className="text-sm leading-6 text-muted">
                    {review.comment}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card className="flex gap-3 border-amber-100 bg-amber-50 text-amber-950">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm leading-6">
          Garemo no procesa pagos ni pedidos. Usa favoritos para organizarte y
          confirma detalles por WhatsApp antes de coordinar cualquier compra.
        </p>
      </Card>
    </div>
  );
}
