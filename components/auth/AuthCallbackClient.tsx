"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import {
  ensureInitialUserProfile,
  getFullNameFromUser,
  getRoleRedirect,
  getSafeSignupRole,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const completeAuth = async () => {
      const code = searchParams.get("code");

      if (!code) {
        setError("No recibimos el codigo de autenticacion.");
        return;
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        setError("No pudimos completar el inicio de sesion con Google.");
        return;
      }

      const { data: userResult } = await supabase.auth.getUser();

      if (!userResult.user) {
        setError("Entraste, pero no pudimos leer tu usuario.");
        return;
      }

      const { data: currentRole } = await supabase.rpc("current_app_role");

      if (currentRole) {
        router.replace(getRoleRedirect(currentRole));
        return;
      }

      const requestedRole = getSafeSignupRole(searchParams.get("role"));
      const { data: profile, error: profileError } =
        await ensureInitialUserProfile(
          supabase,
          requestedRole,
          getFullNameFromUser(userResult.user),
        );

      if (profileError) {
        setError(
          "La cuenta entro con Google, pero falta completar el perfil sin permisos especiales.",
        );
        return;
      }

      if (isMounted) {
        router.replace(getRoleRedirect(profile?.role ?? null));
      }
    };

    completeAuth();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, supabase]);

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
      Completando acceso seguro...
    </div>
  );
}
