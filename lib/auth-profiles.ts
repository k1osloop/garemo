import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type PublicSignupRole = "buyer" | "owner";

export type AppRole = Database["public"]["Enums"]["user_role"];
export type AuthProfile = Database["public"]["Tables"]["users_profile"]["Row"];

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  buyer: "Comprador",
  owner: "Emprendedor",
};

export const roleProfileTitles: Record<AppRole, string> = {
  admin: "Perfil administrador",
  buyer: "Perfil de comprador",
  owner: "Perfil de emprendedor",
};

export const roleDescriptions: Record<AppRole, string> = {
  admin: "Gestiona revisiones, reportes y calidad del directorio.",
  buyer:
    "Explora emprendimientos, guarda favoritos y contacta negocios universitarios.",
  owner: "Gestiona tu negocio, productos, ubicacion y contacto con compradores.",
};

export function getSafeSignupRole(value: unknown): PublicSignupRole {
  return value === "owner" ? "owner" : "buyer";
}

export function getRequestedRoleFromUser(user: User): PublicSignupRole | null {
  const requestedRole = user.user_metadata?.requested_role;

  if (requestedRole === "buyer" || requestedRole === "owner") {
    return requestedRole;
  }

  return null;
}

export function getFullNameFromUser(user: User) {
  const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name;

  return typeof fullName === "string" ? fullName : null;
}

export async function ensureInitialUserProfile(
  supabase: SupabaseClient<Database>,
  requestedRole: PublicSignupRole,
  fullName?: string | null,
) {
  return supabase.rpc("create_initial_user_profile", {
    requested_role: requestedRole,
    requested_full_name: fullName ?? null,
  });
}

export async function getCurrentUserProfile(supabase: SupabaseClient<Database>) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return { profile: null, user: null, error: userError };
  }

  const { data: profile, error } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", userResult.user.id)
    .maybeSingle();

  return {
    profile: (profile as AuthProfile | null) ?? null,
    user: userResult.user,
    error,
  };
}

export function isProfileOnboardingComplete(profile: AuthProfile | null) {
  if (!profile) {
    return false;
  }

  if (profile.role === "admin") {
    return true;
  }

  return profile.onboarding_completed !== false;
}

export function getPostLoginRedirect(profile: AuthProfile | null) {
  if (!profile) {
    return "/onboarding/role";
  }

  if (profile.role === "admin") {
    return "/admin";
  }

  if (!isProfileOnboardingComplete(profile)) {
    return "/onboarding/role";
  }

  return getRoleRedirect(profile.role);
}

export function getRoleRedirect(role: AppRole | null) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "owner") {
    return "/dashboard";
  }

  return "/account";
}
