"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/dashboard");
      }
    });
  }, [router, supabase.auth]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("No pudimos iniciar sesion. Revisa email y contrasena.");
      setIsLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <Card className="mx-auto max-w-md space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase text-brand">
          Acceso emprendedor
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Inicia sesion
        </h1>
        <p className="text-sm leading-6 text-muted">
          Usa tu usuario de Supabase Auth. El panel solo puede editar datos
          propios por RLS.
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
    </Card>
  );
}
