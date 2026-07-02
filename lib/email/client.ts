import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type ClientEmailPayload = {
  businessId?: string | null;
  businessName?: string | null;
  eventType:
    | "business_approved"
    | "business_rejected"
    | "business_needs_changes"
    | "moderation_case"
    | "notification"
    | "password_reset"
    | "welcome";
  message?: string | null;
  moderationThreadId?: string | null;
  notificationId?: string | null;
  targetUserId?: string | null;
  title?: string | null;
};

export async function sendTransactionalEmailFromClient(
  supabase: SupabaseClient<Database>,
  payload: ClientEmailPayload,
) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return { sent: false, skipped: true };
  }

  const response = await fetch("/api/email/transactional", {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return {
    ok: response.ok,
    skipped: response.status === 202,
    status: response.status,
  };
}
