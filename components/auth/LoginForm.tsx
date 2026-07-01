"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Search, Store } from "lucide-react";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getCurrentUserProfile,
  getPostLoginRedirect,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [initialEmail] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("email") ?? "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const redirectAuthenticatedUser = useCallback(
    async () => {
      const { profile, error: profileReadError } =
        await getCurrentUserProfile(supabase);

      if (profileReadError) {
        setError("Entraste, pero no pudimos revisar tu perfil.");
        return;
      }

      router.replace(getPostLoginRedirect(profile));
    },
    [router, supabase],
  );

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        return;
      }

      await redirectAuthenticatedUser();
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

    await redirectAuthenticatedUser();
  }

  return (
    <div className="mx-auto grid max-w-5xl min-w-0 gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="min-w-0 space-y-4">
        <Card className="space-y-3">
          <BrandLogo />
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
            Si tu cuenta es nueva, primero eliges como quieres usar Garemo.
          </p>
        </Card>

        <div className="grid gap-3">
          <Card className="flex gap-3 shadow-sm transition-colors hover:border-brand/30">
            <Search className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-semibold">Comprador - Mi cuenta</h2>
              <p className="text-sm leading-6 text-muted">
                Gestiona tus negocios favoritos y revisa tus calificaciones.
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 shadow-sm transition-colors hover:border-brand/30">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-semibold">
                Emprendedor - Panel de mi negocio
              </h2>
              <p className="text-sm leading-6 text-muted">
                Administra tu perfil, productos y revisa tus estadisticas.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="min-w-0 space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase text-brand">
            Acceso seguro
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Iniciar sesion
          </h2>
          <p className="text-sm leading-6 text-muted">
            Ingresa con tu correo y contrasena. Google es opcional y depende de
            la configuracion OAuth del proyecto.
          </p>
        </div>

        <GoogleAuthButton role="buyer" />

        <div className="flex items-center gap-3 text-xs font-bold uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Email
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" method="post" onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            defaultValue={initialEmail}
            key={initialEmail || "email"}
            label="Email"
            name="email"
            placeholder="tu@email.com"
            required
            type="email"
          />
          <div className="space-y-1 text-right">
            <Input
              autoComplete="current-password"
              label="Contrasena"
              name="password"
              placeholder="********"
              required
              type="password"
            />
            <a
              className="inline-block text-xs font-medium text-brand hover:underline"
              href="/forgot-password"
            >
              Olvidaste tu contrasena?
            </a>
          </div>
          {error ? (
            <p className="rounded-md bg-red-50 p-2 text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
          <Button className="w-full" disabled={isLoading} type="submit">
            <LogIn className="h-4 w-4" />
            {isLoading ? "Entrando..." : "Iniciar sesion"}
          </Button>
        </form>
        <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted">
          No tienes cuenta?{" "}
          <a
            className="font-medium text-brand transition-colors hover:text-brand-hover hover:underline"
            href="/signup"
          >
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
