"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  businessId: string;
  className?: string;
  compact?: boolean;
};

export function FavoriteButton({
  businessId,
  className,
  compact = false,
}: FavoriteButtonProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadFavorite = useCallback(async () => {
    setError(null);

    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult.user;

    if (!user) {
      setIsAuthenticated(false);
      setUserId(null);
      setFavoriteId(null);
      return;
    }

    setIsAuthenticated(true);
    setUserId(user.id);

    const { data, error: favoriteError } = await supabase
      .from("favorites")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (favoriteError) {
      setError("Favoritos aun no estan disponibles.");
      return;
    }

    setFavoriteId(data?.id ?? null);
  }, [businessId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFavorite();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadFavorite]);

  async function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!userId) {
      return;
    }

    setIsBusy(true);
    setError(null);

    if (favoriteId) {
      const { error: deleteError } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", userId);

      if (deleteError) {
        setError("No pudimos quitar el favorito.");
        setIsBusy(false);
        return;
      }

      setFavoriteId(null);
      setIsBusy(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("favorites")
      .insert({
        business_id: businessId,
        user_id: userId,
      })
      .select("id")
      .single();

    if (insertError) {
      setError("No pudimos guardar. Solo negocios publicos pueden guardarse.");
      setIsBusy(false);
      return;
    }

    setFavoriteId(data.id);
    setIsBusy(false);
  }

  if (isAuthenticated === false) {
    return (
      <Link
        className={cn(buttonClassName(Boolean(favoriteId), compact), className)}
        href="/login"
        onClick={(event) => event.stopPropagation()}
      >
        <Bookmark className="h-4 w-4" />
        {compact ? "Guardar" : "Inicia sesion para guardar"}
      </Link>
    );
  }

  const label = favoriteId ? "Favorito" : "Guardar";

  return (
    <div className={cn("space-y-1", className)}>
      <button
        className={buttonClassName(Boolean(favoriteId), compact)}
        disabled={isBusy || isAuthenticated === null}
        onClick={toggleFavorite}
        type="button"
      >
        {favoriteId ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {isBusy ? "Guardando..." : label}
      </button>
      {error && !compact ? (
        <p className="max-w-xs text-xs leading-5 text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

function buttonClassName(isFavorite: boolean, compact: boolean) {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70",
    isFavorite
      ? "border-brand bg-brand text-brand-foreground hover:bg-teal-800"
      : "border-border bg-surface text-foreground hover:bg-background",
    compact ? "shadow-sm" : "",
  );
}
