"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Hubo un problema al actualizar la contraseña. Es posible que el enlace haya expirado.");
      setIsLoading(false);
      return;
    }

    setIsSuccess(true);
    setIsLoading(false);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 mt-10 px-4">
      <Card className="space-y-6 p-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <LockKeyhole className="h-6 w-6 text-brand" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu nueva contraseña para acceder a tu cuenta.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 text-sm font-medium text-green-800 border border-green-200 text-center">
              Contraseña actualizada ✓
            </div>
            <Button className="w-full" onClick={() => router.replace("/login")}>
              Iniciar sesión
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              autoComplete="new-password"
              label="Nueva contraseña"
              name="password"
              placeholder="********"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              autoComplete="new-password"
              label="Confirmar contraseña"
              name="confirmPassword"
              placeholder="********"
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error ? <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-md">{error}</p> : null}
            <Button className="w-full" disabled={isLoading || !password || !confirmPassword} type="submit">
              {isLoading ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
