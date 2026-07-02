"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  MailCheck,
  Store,
  UserRound,
} from "lucide-react";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sendTransactionalEmailFromClient } from "@/lib/email/client";
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
  | { type: "existing_account"; email: string }
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

    const { data: emailAlreadyExists, error: emailCheckError } =
      await supabase.rpc("is_registered_email", {
        candidate_email: email,
      });

    if (emailCheckError) {
      setStatus({
        type: "error",
        message:
          "No pudimos validar el correo en este momento. Intenta nuevamente.",
      });
      setIsLoading(false);
      return;
    }

    if (emailAlreadyExists) {
      setStatus({ type: "existing_account", email });
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
      setStatus({
        type: "error",
        message: getSignupErrorMessage(error.message),
      });
      setIsLoading(false);
      return;
    }

    if (
      data.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      setStatus({ type: "existing_account", email });
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

    await sendTransactionalEmailFromClient(supabase, {
      eventType: "welcome",
      message:
        role === "owner"
          ? "Tu cuenta emprendedora esta lista. Crea tu negocio y espera la revision de Garemo para aparecer en el directorio."
          : "Tu cuenta compradora esta lista. Ya puedes guardar favoritos, calificar negocios y contactar emprendimientos universitarios.",
      targetUserId: profile?.id ?? data.user.id,
    });

    router.replace(getRoleRedirect(profile?.role ?? null));
  }

  if (status.type === "existing_account") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="space-y-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <MailCheck className="h-6 w-6" />
          </span>
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase text-brand">
              Cuenta existente
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Ya existe una cuenta con este correo
            </h1>
            <p className="text-sm leading-6 text-muted">
              Ya existe una cuenta con este correo. Inicia sesión para
              continuar. Tu tipo de cuenta actual se mantiene protegido.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-teal-800"
            href={`/login?email=${encodeURIComponent(status.email)}`}
          >
            Ir a iniciar sesión
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    );
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
              {status.role === "owner" ? "emprendedor" : "comprador"}.
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
              prefetch={false}
            >
              Seguir explorando
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl min-w-0 gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="min-w-0 space-y-4">
        <Card className="space-y-3">
          <BrandLogo />
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
            Elige comprador o emprendedor. Las cuentas de revision se gestionan
            por un proceso interno seguro.
          </p>
        </Card>

        <div className="grid gap-3">
          <Card className="flex gap-3">
            <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-semibold">Comprador</h2>
              <p className="text-sm leading-6 text-muted">
                Guarda favoritos, deja calificaciones y revisa tu historial.
                Tambien puedes explorar sin cuenta.
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 shadow-sm transition-colors hover:border-brand/30">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-semibold">Emprendedor</h2>
              <p className="text-sm leading-6 text-muted">
                Publica tu negocio, muestra tus productos y recibe contactos
                por WhatsApp.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="min-w-0 space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase text-brand">
            Datos de acceso
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Registro seguro
          </h2>
          <p className="text-sm leading-6 text-muted">
            Si Supabase pide confirmar email, veras una pantalla clara antes de
            entrar. Google puede crear el mismo perfil seguro si el proveedor
            esta configurado.
          </p>
        </div>

        <GoogleAuthButton role={selectedRole} />

        <div className="flex items-center gap-3 text-xs font-bold uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Email
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" method="post" onSubmit={handleSubmit}>
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
          Ya tienes cuenta?{" "}
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
    return "Ya existe una cuenta con este correo. Inicia sesión para continuar.";
  }

  if (lower.includes("invalid email") || lower.includes("email address")) {
    return "Ingresa un correo valido.";
  }

  if (lower.includes("password")) {
    return "Usa una contrasena mas segura.";
  }

  if (lower.includes("rate limit")) {
    return "Demasiados intentos. Espera un momento y vuelve a probar.";
  }

  if (lower.includes("signup disabled")) {
    return "El registro no esta disponible en este momento.";
  }

  return "No pudimos completar la accion. Intenta nuevamente.";
}
