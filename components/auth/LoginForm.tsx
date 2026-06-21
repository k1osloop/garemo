"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogIn, Search, ShieldCheck, Store, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        return;
      }

      const { data: role } = await supabase.rpc("current_app_role");

      if (role === "admin") {
        router.replace("/admin");
        return;
      }

      if (role === "owner") {
        router.replace("/dashboard");
        return;
      }

      router.replace("/businesses");
    });
  }, [router, supabase]);

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

    const { data: role } = await supabase.rpc("current_app_role");

    if (role === "admin") {
      router.replace("/admin");
      return;
    }

    if (role === "owner") {
      router.replace("/dashboard");
      return;
    }

    router.replace("/businesses");
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <Card className="space-y-3">
          <p className="text-sm font-medium uppercase text-brand">
            Antes de entrar
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Elige el camino correcto
          </h1>
          <p className="text-sm leading-6 text-muted">
            Garemo mantiene la navegacion publica abierta para estudiantes. Las
            cuentas sirven para vendedores y admins con permisos definidos por
            RLS, no por botones del frontend.
          </p>
        </Card>

        <div className="grid gap-3">
          <Card className="flex gap-3">
            <Search className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Comprador o estudiante</h2>
              <p className="text-sm leading-6 text-muted">
                No necesitas cuenta para explorar negocios, productos, mapa y
                WhatsApp.
              </p>
            </div>
          </Card>
          <Card className="flex gap-3" id="crear-cuenta">
            <UserPlus className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Crear cuenta</h2>
              <p className="text-sm leading-6 text-muted">
                En el piloto, 2DevDogs habilita cuentas de vendedor. Despues de
                entrar, puedes crear tu negocio y esperar aprobacion.
              </p>
            </div>
          </Card>
          <Card className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Admin</h2>
              <p className="text-sm leading-6 text-muted">
                El acceso admin no se solicita ni se elige aqui. Solo funciona
                si el perfil ya tiene rol admin activo en Supabase.
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
            Inicia sesion
          </h2>
          <p className="text-sm leading-6 text-muted">
            Si eres vendedor, entraras al dashboard para crear o editar tu
            negocio propio. Si eres admin, Garemo te enviara al panel de
            revision. Los campos sensibles siguen protegidos por RLS.
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
            label="Contrasena"
            name="password"
            placeholder="********"
            required
            type="password"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" disabled={isLoading} type="submit">
            <LogIn className="h-4 w-4" />
            {isLoading ? "Entrando..." : "Iniciar sesion"}
          </Button>
        </form>
        <div className="grid gap-2 rounded-lg border border-border bg-background p-3 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-brand" />
            <span>Vendedor: crea negocio y espera aprobacion.</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand" />
            <span>Comprador: explora sin cuenta por ahora.</span>
          </div>
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
