import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type PublicSignupRole = "buyer" | "owner";

type AppRole = Database["public"]["Enums"]["user_role"];

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
  const fullName = user.user_metadata?.full_name;

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

export function getRoleRedirect(role: AppRole | null) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "owner") {
    return "/dashboard";
  }

  return "/account";
}
