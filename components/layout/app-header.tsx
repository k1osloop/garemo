import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 w-full max-w-md items-center justify-between px-4">
        <Link className="text-lg font-semibold tracking-tight" href="/">
          Garemo
        </Link>
        <nav className="flex items-center gap-3 text-sm text-muted">
          <Link href="/businesses">Directorio</Link>
          <Link href="/login">Login</Link>
        </nav>
      </div>
    </header>
  );
}
