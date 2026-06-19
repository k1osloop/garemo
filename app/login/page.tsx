import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <PageShell title="Login">
      <form className="space-y-4">
        <Input label="Email" placeholder="tu@email.com" type="email" />
        <Input label="Contrasena" placeholder="********" type="password" />
        <Button className="w-full" type="button">
          Iniciar sesion placeholder
        </Button>
      </form>
    </PageShell>
  );
}
