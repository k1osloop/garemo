"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  MailCheck,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ensureInitialUserProfile,
  getRoleRedirect,
  getSafeSignupRole,
  type PublicSignupRole,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SignupStatus =
  | { type: "idle" }
  | { type: "confirm_email"; email: string; role: PublicSignupRole }
  | { type: "error"; message: string };

export function SignupForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<PublicSignupRole>("buyer");
  const [status, setStatus] = useState<SignupStatus>({ type: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setStatus({ type: "idle" });

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");
    const fullName = String(formData.get("full_name") ?? "").trim();
    const role = getSafeSignupRole(formData.get("role"));

    if (!email || !password || !confirmPassword) {
      setStatus({
        type: "error",
        message: "Completa email, contrasena y confirmacion.",
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setStatus({
        type: "error",
        message: "La contrasena debe tener al menos 8 caracteres.",
      });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        type: "error",
        message: "Las contrasenas no coinciden.",
      });
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
          requested_role: role,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setStatus({ type: "error", message: getSignupErrorMessage(error.message) });
      setIsLoading(false);
      return;
    }

    if (!data.session || !data.user) {
      setStatus({ type: "confirm_email", email, role });
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } =
      await ensureInitialUserProfile(supabase, role, fullName || null);

    if (profileError) {
      setStatus({
        type: "error",
        message:
          "La cuenta fue creada, pero no pudimos crear el perfil. Inicia sesion para completarlo.",
      });
      setIsLoading(false);
      return;
    }

    router.replace(getRoleRedirect(profile?.role ?? null));
  }

  if (status.type === "confirm_email") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="space-y-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <MailCheck className="h-6 w-6" />
          </span>
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase text-brand">
              Cuenta creada
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Revisa tu correo para confirmar tu cuenta
            </h1>
            <p className="text-sm leading-6 text-muted">
              Enviamos un enlace a {status.email}. Cuando confirmes el email,
              vuelve a iniciar sesion. Garemo creara tu perfil como{" "}
              {status.role === "owner" ? "emprendedor" : "comprador"} sin
              permisos admin.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-teal-800"
              href="/login"
            >
              Ir a iniciar sesion
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface"
              href="/businesses"
            >
              Seguir explorando
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <Card className="space-y-3">
          <img src="/brand/logo.svg" alt="Garemo Logo" className="h-12 w-auto mb-2 drop-shadow-sm" />
          <p className="text-sm font-medium uppercase text-brand">
            Registro publico
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Crea tu cuenta Garemo
          </h1>
          <p className="text-sm font-medium text-brand/80">
            Compra talento universitario
          </p>
          <p className="text-sm leading-6 text-muted">
            Elige comprador o emprendedor. El rol admin no se puede solicitar ni
            activar desde esta pantalla; solo 2DevDogs lo asigna manualmente
            cuando corresponde.
          </p>
        </Card>

        <div className="grid gap-3">
          <Card className="flex gap-3">
            <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Comprador</h2>
              <p className="text-sm leading-6 text-muted">
                Guarda favoritos, deja calificaciones y revisa tu historial.
                Tambien puedes explorar sin cuenta.
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 hover:border-brand/30 transition-colors shadow-sm">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Emprendedor</h2>
              <p className="text-sm leading-6 text-muted">
                Publica tu negocio, muestra tus productos y recibe contactos por WhatsApp.
              </p>
            </div>
          </Card>
          <Card className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Admin protegido</h2>
              <p className="text-sm leading-6 text-muted">
                Ningun usuario puede convertirse en admin desde el frontend.
                RLS y la RPC solo aceptan buyer u owner.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase text-brand">
            Datos de acceso
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Registro seguro
          </h2>
          <p className="text-sm leading-6 text-muted">
            Si Supabase pide confirmar email, veras una pantalla clara antes de
            entrar. Tu perfil se crea con el rol publico elegido al iniciar
            sesion confirmado.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">Tipo de cuenta</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Comprador",
                  role: "buyer" as const,
                  text: "Favoritos y calificaciones.",
                },
                {
                  label: "Emprendedor",
                  role: "owner" as const,
                  text: "Publica tu negocio.",
                },
              ].map((option) => (
                <label
                  className={`grid cursor-pointer gap-1.5 rounded-xl border p-4 text-sm transition-all duration-200 ${
                    selectedRole === option.role
                      ? "border-brand bg-brand/5 shadow-sm ring-1 ring-brand/20"
                      : "border-border bg-surface hover:border-brand/30 hover:bg-slate-50"
                  }`}
                  key={option.role}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <input
                      checked={selectedRole === option.role}
                      className="h-4 w-4 accent-brand"
                      name="role"
                      onChange={() => setSelectedRole(option.role)}
                      type="radio"
                      value={option.role}
                    />
                    {option.label}
                  </span>
                  <span className="text-muted">{option.text}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Input
            autoComplete="name"
            label="Nombre visible opcional"
            name="full_name"
            placeholder="Tu nombre o emprendimiento"
            type="text"
          />
          <Input
            autoComplete="email"
            label="Email"
            name="email"
            placeholder="tu@email.com"
            required
            type="email"
          />
          <Input
            autoComplete="new-password"
            label="Contrasena"
            minLength={8}
            name="password"
            placeholder="Minimo 8 caracteres"
            required
            type="password"
          />
          <Input
            autoComplete="new-password"
            label="Confirmar contrasena"
            minLength={8}
            name="confirm_password"
            placeholder="Repite tu contrasena"
            required
            type="password"
          />

          {status.type === "error" ? (
            <p className="text-sm text-red-600">{status.message}</p>
          ) : null}

          <Button className="w-full" disabled={isLoading} type="submit">
            <CheckCircle2 className="h-4 w-4" />
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-medium text-brand hover:underline" href="/login">
            Inicia sesion
          </Link>
        </div>
      </Card>
    </div>
  );
}

function getSignupErrorMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "Este email ya tiene una cuenta. Inicia sesion o usa otro correo.";
  }

  if (lower.includes("password")) {
    return "La contrasena no cumple los requisitos. Usa al menos 8 caracteres.";
  }

  if (lower.includes("rate limit")) {
    return "Demasiados intentos. Espera un momento y vuelve a probar.";
  }

  return "No pudimos crear la cuenta. Revisa los datos e intenta de nuevo.";
}
