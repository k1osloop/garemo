import { getPublicSiteUrl } from "@/lib/email/resend";

export const transactionalEmailEvents = [
  "business_approved",
  "business_rejected",
  "business_needs_changes",
  "notification",
  "moderation_case",
  "password_reset",
  "welcome",
] as const;

export type TransactionalEmailEvent =
  (typeof transactionalEmailEvents)[number];

type TemplateInput = {
  businessName?: string | null;
  message?: string | null;
  title?: string | null;
};

export function isTransactionalEmailEvent(
  value: unknown,
): value is TransactionalEmailEvent {
  return (
    typeof value === "string" &&
    transactionalEmailEvents.includes(value as TransactionalEmailEvent)
  );
}

export function buildTransactionalEmail(
  eventType: TransactionalEmailEvent,
  input: TemplateInput = {},
) {
  const siteUrl = getPublicSiteUrl();
  const dashboardUrl = `${siteUrl}/dashboard`;
  const accountUrl = `${siteUrl}/account`;
  const resetUrl = `${siteUrl}/forgot-password`;
  const businessName = input.businessName ?? "tu negocio";

  if (eventType === "business_approved") {
    return {
      actionLabel: "Ver mi negocio",
      actionUrl: dashboardUrl,
      eyebrow: "Verificacion aprobada",
      message:
        input.message ??
        `${businessName} ya esta visible en Garemo. Revisa tu panel para mantener productos, horarios y contacto actualizados.`,
      preview: "Tu negocio fue aprobado en Garemo.",
      subject: "Tu negocio fue aprobado en Garemo",
      title: "Tu negocio ya puede aparecer en Garemo",
    };
  }

  if (
    eventType === "business_rejected" ||
    eventType === "business_needs_changes"
  ) {
    return {
      actionLabel: "Ver correcciones",
      actionUrl: dashboardUrl,
      eyebrow: "Correcciones pendientes",
      message:
        input.message ??
        `Garemo reviso ${businessName} y necesita que corrijas algunos datos antes de volver a revision.`,
      preview: "Tu negocio necesita correcciones en Garemo.",
      subject: "Tu negocio necesita correcciones",
      title: "Hay observaciones para corregir",
    };
  }

  if (eventType === "moderation_case") {
    return {
      actionLabel: "Responder en Garemo",
      actionUrl: accountUrl,
      eyebrow: "Nuevo caso de moderacion",
      message:
        input.message ??
        "El equipo de Garemo dejo un mensaje sobre una revision o reporte. Entra para responder o revisar los pasos siguientes.",
      preview: "Tienes un nuevo mensaje de Garemo.",
      subject: "Tienes un nuevo mensaje de Garemo",
      title: "Garemo necesita tu respuesta",
    };
  }

  if (eventType === "password_reset") {
    return {
      actionLabel: "Recuperar contrasena",
      actionUrl: resetUrl,
      eyebrow: "Seguridad de cuenta",
      message:
        input.message ??
        "Solicitaste restablecer tu contrasena. Usa el enlace enviado por Garemo y no compartas tus credenciales con nadie.",
      preview: "Recupera el acceso a tu cuenta Garemo.",
      subject: "Recupera tu cuenta Garemo",
      title: "Recupera tu acceso de forma segura",
    };
  }

  if (eventType === "welcome") {
    return {
      actionLabel: "Empezar en Garemo",
      actionUrl: accountUrl,
      eyebrow: "Bienvenida",
      message:
        input.message ??
        "Tu cuenta Garemo esta lista. Puedes explorar negocios universitarios, guardar favoritos y contactar emprendimientos por WhatsApp.",
      preview: "Bienvenido a Garemo.",
      subject: "Bienvenido a Garemo",
      title: "Bienvenido a Garemo",
    };
  }

  return {
    actionLabel: "Abrir Garemo",
    actionUrl: accountUrl,
    eyebrow: "Nueva notificacion",
    message:
      input.message ??
      "Tienes una nueva notificacion importante dentro de Garemo.",
    preview: "Tienes una nueva notificacion en Garemo.",
    subject: input.title ?? "Nueva notificacion en Garemo",
    title: input.title ?? "Nueva notificacion en Garemo",
  };
}
