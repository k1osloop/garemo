import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Recuperar contraseña - Garemo",
  description: "Recupera el acceso a tu cuenta en Garemo.",
};

export default function ForgotPasswordPage() {
  return (
    <PageShell title="Recuperar contraseña">
      <ForgotPasswordForm />
    </PageShell>
  );
}
