import { NextRequest } from "next/server";

import { getSafeSignupRole } from "@/lib/auth-profiles";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const credential = String(formData.get("credential") ?? "");
  const role = getSafeSignupRole(
    request.cookies.get("garemo_google_role")?.value,
  );

  if (!credential) {
    return htmlResponse(
      "No recibimos una credencial valida de Google.",
      "/login?google=missing_credential",
    );
  }

  return new Response(
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Entrando a Garemo</title>
  </head>
  <body>
    <p>Completando acceso seguro...</p>
    <script>
      sessionStorage.setItem("garemo_google_credential", ${JSON.stringify(credential)});
      sessionStorage.setItem("garemo_google_role", ${JSON.stringify(role)});
      window.location.replace("/auth/google/complete");
    </script>
  </body>
</html>`,
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

export function GET() {
  return htmlResponse(
    "Este acceso solo acepta una respuesta segura de Google.",
    "/login",
  );
}

function htmlResponse(message: string, redirectTo: string) {
  return new Response(
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acceso Garemo</title>
  </head>
  <body>
    <p>${escapeHtml(message)}</p>
    <script>window.location.replace(${JSON.stringify(redirectTo)});</script>
  </body>
</html>`,
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
