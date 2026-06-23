"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BusinessReview } from "@/types/database";

type BusinessReviewFormProps = {
  businessId: string;
  ownerId: string;
};

export function BusinessReviewForm({
  businessId,
  ownerId,
}: BusinessReviewFormProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState<BusinessReview | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const loadReview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult.user;

    if (!user) {
      setUserId(null);
      setIsLoading(false);
      return;
    }

    setUserId(user.id);

    if (user.id === ownerId) {
      setIsOwner(true);
      setIsLoading(false);
      return;
    }

    const { data, error: reviewError } = await supabase
      .from("business_reviews")
      .select(
        "id,business_id,user_id,rating,comment,status,moderation_notes,created_at,updated_at",
      )
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (reviewError) {
      setError("Las calificaciones aun no estan disponibles.");
      setIsLoading(false);
      return;
    }

    if (data) {
      setReview(data as BusinessReview);
      setRating(data.rating);
      setComment(data.comment ?? "");
    }

    setIsLoading(false);
  }, [businessId, ownerId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReview();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReview]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || isOwner) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const cleanedComment = comment.trim() ? comment.trim() : null;
    const reviewSelection =
      "id,business_id,user_id,rating,comment,status,moderation_notes,created_at,updated_at";

    const saveResult = review
      ? await supabase
          .from("business_reviews")
          .update({
            rating,
            comment: cleanedComment,
            updated_at: new Date().toISOString(),
          })
          .eq("id", review.id)
          .eq("business_id", businessId)
          .eq("user_id", userId)
          .select(reviewSelection)
          .single()
      : await supabase
          .from("business_reviews")
          .insert({
            business_id: businessId,
            user_id: userId,
            rating,
            comment: cleanedComment,
            status: "visible",
          })
          .select(reviewSelection)
          .single();

    const { data, error: saveError } = saveResult;

    if (saveError) {
      setError(
        "No pudimos guardar tu calificacion. Solo usuarios autenticados no propietarios pueden calificar.",
      );
      setIsSaving(false);
      return;
    }

    setReview(data as BusinessReview);
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Revisando si puedes calificar...</p>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card className="space-y-2">
        <h2 className="text-base font-semibold">Califica este negocio</h2>
        <p className="text-sm leading-6 text-muted">
          Inicia sesion para calificar. Esto ayuda a otros estudiantes sin
          convertir Garemo en sistema de ventas.
        </p>
        <a
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-background"
          href="/login"
        >
          Inicia sesion para calificar
        </a>
      </Card>
    );
  }

  if (isOwner) {
    return (
      <Card>
        <p className="text-sm leading-6 text-muted">
          No puedes calificar tu propio negocio. Las calificaciones deben venir
          de clientes autenticados.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Tu calificacion</h2>
        <p className="text-sm leading-6 text-muted">
          Puedes dejar o actualizar una calificacion por negocio. Comentarios
          abusivos pueden ocultarse por admin.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              className={
                value <= rating
                  ? "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-brand-foreground"
                  : "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted"
              }
              key={value}
              onClick={() => setRating(value)}
              type="button"
            >
              <Star className="h-4 w-4" />
            </button>
          ))}
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Comentario opcional
          <textarea
            className="min-h-24 rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            maxLength={280}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Breve, claro y respetuoso."
            value={comment}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {review ? (
          <p className="text-sm text-brand">Calificacion guardada.</p>
        ) : null}
        <Button disabled={isSaving} type="submit">
          {isSaving ? "Guardando..." : review ? "Actualizar calificacion" : "Enviar calificacion"}
        </Button>
      </form>
    </Card>
  );
}
