import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type SupabaseBrowserClient = ReturnType<typeof createClient<Database>>;

let browserClient: SupabaseBrowserClient | null = null;

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (typeof window === "undefined") {
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  browserClient ??= createClient<Database>(supabaseUrl, supabaseAnonKey);

  return browserClient;
}
