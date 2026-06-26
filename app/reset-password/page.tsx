import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Restablecer contraseña - Garemo",
  description: "Crea una nueva contraseña para tu cuenta en Garemo.",
};

export default function ResetPasswordPage() {
  return (
    <PageShell title="Nueva contraseña">
      <ResetPasswordForm />
    </PageShell>
  );
}
