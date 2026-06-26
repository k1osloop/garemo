"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();
    
    // Determine the base URL for the reset redirect
    // We can rely on window.location.origin in the browser
    const redirectUrl = `${window.location.origin}/reset-password`;

    // We don't check for errors here to prevent email enumeration,
    // as requested: "No revelar si el correo existe o no."
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl,
    });

    setIsSuccess(true);
    setIsLoading(false);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 mt-10 px-4">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a iniciar sesión
      </Link>

      <Card className="space-y-6 p-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <Mail className="h-6 w-6 text-brand" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Recuperar contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva.
          </p>
        </div>

        {isSuccess ? (
          <div className="rounded-md bg-green-50 p-4 text-sm font-medium text-green-800 border border-green-200 text-center">
            Si el correo está registrado, te enviaremos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o carpeta de spam.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              autoComplete="email"
              label="Email"
              name="email"
              placeholder="tu@email.com"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button className="w-full" disabled={isLoading || !email} type="submit">
              {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
