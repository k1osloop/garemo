"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getCurrentUserProfile,
  getPostLoginRedirect,
  getRoleRedirect,
  type PublicSignupRole,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const options: Array<{
  button: string;
  description: string;
  icon: typeof Search;
  role: PublicSignupRole;
  title: string;
}> = [
  {
    button: "Entrar como comprador",
    description: "Explorar negocios, guardar favoritos y contactar por WhatsApp.",
    icon: Search,
    role: "buyer",
    title: "Quiero comprar",
  },
  {
    button: "Crear perfil emprendedor",
    description: "Publicar mi emprendimiento universitario y gestionar productos.",
    icon: Store,
    role: "owner",
    title: "Quiero vender",
  },
];

export function RoleOnboardingClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<PublicSignupRole | null>(
    null,
  );

  const validateSession = useCallback(async () => {
    const { error: profileError, profile, user } =
      await getCurrentUserProfile(supabase);

    if (!user) {
      router.replace("/login");
      return;
    }

    if (profileError) {
      setError("No pudimos revisar tu perfil. Intenta de nuevo.");
      setIsLoading(false);
      return;
    }

    if (profile?.role === "admin" || profile?.onboarding_completed === true) {
      router.replace(getPostLoginRedirect(profile));
      return;
    }

    setIsLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void validateSession();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [validateSession]);

  async function chooseRole(role: PublicSignupRole) {
    setSelectedRole(role);
    setError(null);

    const { data, error: roleError } = await supabase.rpc("update_my_role", {
      selected_role: role,
    });

    if (roleError) {
      setError(
        "No pudimos guardar tu tipo de cuenta. Aplica el SQL de onboarding y vuelve a intentar.",
      );
      setSelectedRole(null);
      return;
    }

    router.replace(getRoleRedirect(data?.role ?? role));
  }

  if (isLoading) {
    return (
      <Card className="mx-auto max-w-lg">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          Preparando tu cuenta...
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="space-y-2 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">
          Bienvenido a Garemo
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Como quieres usar Garemo?
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
          Puedes empezar como comprador o publicar tu emprendimiento
          universitario.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedRole === option.role;

          return (
            <Card
              className="flex min-h-[17rem] flex-col justify-between rounded-[1.5rem] bg-white p-5 shadow-sm"
              key={option.role}
            >
              <div className="space-y-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {option.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>

              <Button
                className="mt-5 w-full rounded-2xl font-extrabold"
                disabled={selectedRole !== null}
                onClick={() => void chooseRole(option.role)}
                type="button"
              >
                {isSelected ? "Guardando..." : option.button}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
