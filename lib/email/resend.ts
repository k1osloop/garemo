import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  resendClient ??= new Resend(apiKey);

  return resendClient;
}

export function getEmailFromAddress() {
  return (
    process.env.GAREMO_EMAIL_FROM ??
    "Garemo <no-reply@garemo.online>"
  );
}

export function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^/, "https://") ??
    "https://www.garemo.online"
  );
}
