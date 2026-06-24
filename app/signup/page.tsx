import { SignupForm } from "@/components/auth/SignupForm";
import { PageShell } from "@/components/layout/page-shell";

export default function SignupPage() {
  return (
    <PageShell title="Crear cuenta">
      <SignupForm />
    </PageShell>
  );
}
