import { NextResponse } from "next/server";
import { z } from "zod";

import { GaremoTransactionalEmail } from "@/emails/GaremoTransactionalEmail";
import { getEmailFromAddress, getResendClient } from "@/lib/email/resend";
import {
  buildTransactionalEmail,
  isTransactionalEmailEvent,
  transactionalEmailEvents,
} from "@/lib/email/transactional-events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  businessId: z.string().uuid().optional().nullable(),
  businessName: z.string().max(160).optional().nullable(),
  eventType: z.enum(transactionalEmailEvents),
  message: z.string().max(1200).optional().nullable(),
  moderationThreadId: z.string().uuid().optional().nullable(),
  notificationId: z.string().uuid().optional().nullable(),
  targetUserId: z.string().uuid().optional().nullable(),
  title: z.string().max(200).optional().nullable(),
});

const maxEmailEventsPerUserPerHour = 20;
const resendRetryAttempts = 2;

type ResendClient = NonNullable<ReturnType<typeof getResendClient>>;
type ResendSendPayload = Parameters<ResendClient["emails"]["send"]>[0];
type ResendSendOptions = Parameters<ResendClient["emails"]["send"]>[1];

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function genericError(status = 400) {
  return NextResponse.json(
    { error: "No pudimos procesar el correo transaccional." },
    { status },
  );
}

async function sendWithRetry(
  resend: ResendClient,
  payload: ResendSendPayload,
  options?: ResendSendOptions,
) {
  let lastResult: Awaited<ReturnType<ResendClient["emails"]["send"]>> | null =
    null;

  for (let attempt = 1; attempt <= resendRetryAttempts; attempt += 1) {
    lastResult = await resend.emails.send(payload, options);

    if (!lastResult.error) {
      return lastResult;
    }

    if (attempt < resendRetryAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }

  return lastResult;
}

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return genericError(401);
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || !isTransactionalEmailEvent(parsed.data.eventType)) {
    return genericError(400);
  }

  const supabase = createSupabaseServerClient(token);
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return genericError(401);
  }

  const { data: role, error: roleError } =
    await supabase.rpc("current_app_role");

  if (roleError) {
    return genericError(403);
  }

  const payload = parsed.data;
  const isAdminEvent = [
    "business_approved",
    "business_rejected",
    "business_needs_changes",
    "moderation_case",
    "notification",
  ].includes(payload.eventType);

  if (isAdminEvent && role !== "admin") {
    return genericError(403);
  }

  const targetUserId = payload.targetUserId ?? userResult.user.id;
  let recipientEmail = userResult.user.email ?? null;

  if (targetUserId !== userResult.user.id) {
    const { data: targetProfile, error: targetError } = await supabase
      .from("users_profile")
      .select("id, email")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetError || !targetProfile?.email) {
      return genericError(400);
    }

    recipientEmail = targetProfile.email;
  }

  if (!recipientEmail) {
    return genericError(400);
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentEmailCount, error: rateLimitError } = await supabase
    .from("email_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", targetUserId)
    .gte("created_at", oneHourAgo);

  if (rateLimitError) {
    return genericError(403);
  }

  if ((recentEmailCount ?? 0) >= maxEmailEventsPerUserPerHour) {
    return genericError(429);
  }

  const template = buildTransactionalEmail(payload.eventType, {
    businessName: payload.businessName,
    message: payload.message,
    title: payload.title,
  });

  const baseEvent = {
    business_id: payload.businessId ?? null,
    event_type: payload.eventType,
    metadata: {
      title: payload.title ?? null,
    },
    moderation_thread_id: payload.moderationThreadId ?? null,
    notification_id: payload.notificationId ?? null,
    recipient_email: recipientEmail,
    subject: template.subject,
    user_id: targetUserId,
  };

  const resend = getResendClient();

  if (!resend) {
    await supabase.from("email_events").insert({
      ...baseEvent,
      attempts: 0,
      last_error: "RESEND_API_KEY is not configured",
      status: "skipped",
    });

    return NextResponse.json(
      {
        configured: false,
        sent: false,
      },
      { status: 202 },
    );
  }

  const { data: emailEvent } = await supabase
    .from("email_events")
    .insert({
      ...baseEvent,
      attempts: 1,
      status: "queued",
    })
    .select("id")
    .maybeSingle();

  const resendResult = await sendWithRetry(
    resend,
    {
      from: getEmailFromAddress(),
      react: GaremoTransactionalEmail(template),
      subject: template.subject,
      to: recipientEmail,
    },
    emailEvent?.id
      ? {
          headers: {
            "Idempotency-Key": `garemo-${emailEvent.id}`,
          },
        }
      : undefined,
  );
  const data = resendResult?.data ?? null;
  const error =
    resendResult?.error ??
    (resendResult
      ? null
      : {
          message: "Email provider did not return a result",
        });

  if (error) {
    if (emailEvent?.id) {
      await supabase
        .from("email_events")
        .update({
          last_error: error.message,
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", emailEvent.id);
    }

    return genericError(502);
  }

  if (emailEvent?.id) {
    await supabase
      .from("email_events")
      .update({
        provider_message_id: data?.id ?? null,
        sent_at: new Date().toISOString(),
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailEvent.id);
  }

  return NextResponse.json({
    configured: true,
    id: data?.id ?? null,
    sent: true,
  });
}
