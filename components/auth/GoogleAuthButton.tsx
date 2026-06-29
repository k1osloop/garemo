"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ensureInitialUserProfile,
  getFullNameFromUser,
  getRoleRedirect,
  type PublicSignupRole,
} from "@/lib/auth-profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GoogleAuthButtonProps = {
  role?: PublicSignupRole;
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (options: {
      callback: (response: GoogleCredentialResponse) => void;
      client_id: string;
      context?: "signin" | "signup" | "use";
      ux_mode?: "popup" | "redirect";
    }) => void;
    renderButton: (
      parent: HTMLElement,
      options: {
        locale?: string;
        shape?: "pill" | "rectangular" | "circle" | "square";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        theme?: "outline" | "filled_blue" | "filled_black";
        type?: "standard" | "icon";
        width?: number;
      },
    ) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "201900849028-9bd8us6kcdm4bkq8j06tu35g0t6up0l4.apps.googleusercontent.com";

export function GoogleAuthButton({ role = "buyer" }: GoogleAuthButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      if (window.google?.accounts?.id) {
        queueMicrotask(() => setScriptReady(true));
      } else {
        existingScript.addEventListener("load", () => setScriptReady(true), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => setScriptReady(true);
    script.onerror = () =>
      setError("No pudimos cargar Google. Usa email y contrasena.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptReady || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    buttonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      callback: async (response) => {
        setError(null);
        setIsLoading(true);

        if (!response.credential) {
          setError("Google no devolvio una credencial valida.");
          setIsLoading(false);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (signInError) {
          setError(
            "No pudimos iniciar sesion con Google. Usa email y contrasena o intenta de nuevo.",
          );
          setIsLoading(false);
          return;
        }

        const { data: userResult } = await supabase.auth.getUser();

        if (!userResult.user) {
          setError("Entraste con Google, pero no pudimos leer tu usuario.");
          setIsLoading(false);
          return;
        }

        const { data: currentRole } = await supabase.rpc("current_app_role");

        if (currentRole) {
          router.replace(getRoleRedirect(currentRole));
          return;
        }

        const { data: profile, error: profileError } =
          await ensureInitialUserProfile(
            supabase,
            role,
            getFullNameFromUser(userResult.user),
          );

        if (profileError) {
          setError(
            "Entraste con Google, pero falta completar tu perfil sin permisos especiales.",
          );
          setIsLoading(false);
          return;
        }

        router.replace(getRoleRedirect(profile?.role ?? null));
      },
      client_id: GOOGLE_CLIENT_ID,
      context: role === "owner" ? "signup" : "signin",
      ux_mode: "popup",
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      locale: "es",
      shape: "pill",
      size: "large",
      text: "continue_with",
      theme: "outline",
      type: "standard",
      width: buttonRef.current.offsetWidth || 320,
    });
  }, [role, router, scriptReady, supabase]);

  return (
    <div className="space-y-2">
      <div
        aria-busy={isLoading}
        className="min-h-11 w-full overflow-hidden rounded-lg"
        ref={buttonRef}
      />
      {!scriptReady ? (
        <p className="rounded-lg bg-surface p-2 text-xs font-medium text-muted">
          Cargando Google...
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
