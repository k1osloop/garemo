"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import {
  getCurrentUserProfile,
  getPostLoginRedirect,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleRedirectCompleteClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const completeGoogleAuth = async () => {
      const credential = sessionStorage.getItem("garemo_google_credential");

      sessionStorage.removeItem("garemo_google_credential");
      sessionStorage.removeItem("garemo_google_role");

      if (!credential) {
        setError("No recibimos una credencial valida de Google.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
      });

      if (signInError) {
        setError(
          "No pudimos iniciar sesion con Google. Usa email y contrasena o intenta de nuevo.",
        );
        return;
      }

      const { error: profileReadError, profile, user } =
        await getCurrentUserProfile(supabase);

      if (!user) {
        setError("Entraste con Google, pero no pudimos leer tu usuario.");
        return;
      }

      if (profileReadError) {
        setError(
          "Entraste con Google, pero no pudimos revisar tu perfil. Intenta de nuevo.",
        );
        return;
      }

      if (isMounted) {
        router.replace(getPostLoginRedirect(profile));
      }
    };

    completeGoogleAuth();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-sm">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-2">
            <h1 className="text-lg font-bold">No se completo el acceso</h1>
            <p className="text-sm leading-6">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg items-center gap-3 rounded-3xl border border-border bg-surface p-5 text-sm font-medium text-muted-foreground shadow-sm">
      <Loader2 className="h-5 w-5 animate-spin text-brand" />
      Completando acceso con Google...
    </div>
  );
}
