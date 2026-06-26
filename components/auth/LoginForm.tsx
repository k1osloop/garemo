"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Search, ShieldCheck, Store } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ensureInitialUserProfile,
  getFullNameFromUser,
  getRequestedRoleFromUser,
  getRoleRedirect,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const redirectAuthenticatedUser = useCallback(async (user: User) => {
    const { data: currentRole } = await supabase.rpc("current_app_role");

    if (currentRole) {
      router.replace(getRoleRedirect(currentRole));
      return;
    }

    const requestedRole = getRequestedRoleFromUser(user);

    if (requestedRole) {
      const { data: profile } = await ensureInitialUserProfile(
        supabase,
        requestedRole,
        getFullNameFromUser(user),
      );

      router.replace(getRoleRedirect(profile?.role ?? null));
      return;
    }

    router.replace("/account");
  }, [router, supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        return;
      }

      await redirectAuthenticatedUser(data.user);
    });
  }, [redirectAuthenticatedUser, supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Completa email y contrasena.");
      setIsLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(getAuthErrorMessage(signInError.message));
      setIsLoading(false);
      return;
    }

    const { data: userResult } = await supabase.auth.getUser();

    if (!userResult.user) {
      setError("Entraste, pero no pudimos leer tu usuario.");
      setIsLoading(false);
      return;
    }

    await redirectAuthenticatedUser(userResult.user);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <Card className="space-y-3">
          <img src="/brand/logo.svg" alt="Garemo Logo" className="h-12 w-auto mb-2 drop-shadow-sm" />
          <p className="text-sm font-medium uppercase text-brand">
            Bienvenido de vuelta
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Entra a tu cuenta Garemo
          </h1>
          <p className="text-sm font-medium text-brand/80">
            Compra talento universitario
          </p>
          <p className="text-sm leading-6 text-muted">
            Garemo te redirigirá a la vista correcta según tu rol.
          </p>
        </Card>

        <div className="grid gap-3">
          <Card className="flex gap-3 hover:border-brand/30 transition-colors shadow-sm">
            <Search className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Comprador → Mi cuenta</h2>
              <p className="text-sm leading-6 text-muted">
                Gestiona tus negocios favoritos y revisa tus calificaciones.
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 hover:border-brand/30 transition-colors shadow-sm" id="crear-cuenta">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Emprendedor → Panel de mi negocio</h2>
              <p className="text-sm leading-6 text-muted">
                Administra tu perfil, productos y revisa tus estadísticas.
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 hover:border-brand/30 transition-colors shadow-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Admin → Administración</h2>
              <p className="text-sm leading-6 text-muted">
                Acceso exclusivo para revisión y moderación.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase text-brand">
            Acceso seguro
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Iniciar sesión
          </h2>
          <p className="text-sm leading-6 text-muted">
            Ingresa con tu correo y contraseña. Los campos sensibles están protegidos por RLS.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            label="Email"
            name="email"
            placeholder="tu@email.com"
            required
            type="email"
          />
          <Input
            autoComplete="current-password"
            label="Contraseña"
            name="password"
            placeholder="********"
            required
            type="password"
          />
          {error ? <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-md">{error}</p> : null}
          <Button className="w-full" disabled={isLoading} type="submit">
            <LogIn className="h-4 w-4" />
            {isLoading ? "Entrando..." : "Iniciar sesión"}
          </Button>
        </form>
        <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <a className="font-medium text-brand hover:text-brand-hover hover:underline transition-colors" href="/signup">
            Crea una cuenta nueva
          </a>
        </div>
      </Card>
    </div>
  );
}

function getAuthErrorMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Email o contrasena incorrectos.";
  }

  if (lower.includes("email not confirmed")) {
    return "Debes confirmar tu email antes de entrar.";
  }

  if (lower.includes("rate limit")) {
    return "Demasiados intentos. Espera un momento y vuelve a probar.";
  }

  return "No pudimos iniciar sesion. Revisa tus datos e intenta de nuevo.";
}
