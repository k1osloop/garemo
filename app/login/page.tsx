import { PageShell } from "@/components/layout/page-shell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <PageShell title="Login">
      <LoginForm />
    </PageShell>
  );
}
