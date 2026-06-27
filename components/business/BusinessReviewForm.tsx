"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

    const isNew = !review;
    setReview(data as BusinessReview);
    setIsSaving(false);
    
    if (isNew) {
      setSuccessMessage("Gracias por tu opinión ✓");
      setComment("");
    } else {
      setSuccessMessage("Tu opinión fue actualizada ✓");
    }
    
    router.refresh();
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
          Inicia sesión para calificar este negocio y ayudar a otros estudiantes.
        </p>
        <a
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-background"
          href="/login"
        >
          Iniciar sesión
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
        <h2 className="text-base font-semibold">Tu calificación</h2>
        <p className="text-sm leading-6 text-muted">
          Puedes actualizar tu opinión cuando quieras.
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
            onChange={(event) => {
              setComment(event.target.value);
              setSuccessMessage(null);
            }}
            placeholder={review ? "Edita tu opinión" : "Breve, claro y respetuoso."}
            value={comment}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {successMessage && !isSaving ? (
          <p className="text-sm font-semibold text-brand">
            {successMessage}
          </p>
        ) : null}
        <Button disabled={isSaving} type="submit">
          {isSaving ? "Guardando..." : review ? "Actualizar calificación" : "Enviar calificación"}
        </Button>
      </form>
    </Card>
  );
}
