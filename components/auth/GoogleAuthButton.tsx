"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PublicSignupRole } from "@/lib/auth-profiles";

type GoogleAuthButtonProps = {
  role?: PublicSignupRole;
};

export function GoogleAuthButton({ role = "buyer" }: GoogleAuthButtonProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (oauthError) {
      setError(
        "Google aun no esta configurado para Garemo. Usa email y contrasena o revisa la configuracion OAuth.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        className="w-full border-border bg-white text-foreground hover:bg-slate-50"
        disabled={isLoading}
        onClick={handleGoogleAuth}
        type="button"
        variant="outline"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-sm font-extrabold text-brand">
          G
        </span>
        {isLoading ? "Conectando con Google..." : "Continuar con Google"}
      </Button>
      {error ? (
        <p className="rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
