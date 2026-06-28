"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Search, UserCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/businesses", icon: Search, label: "Explorar" },
  { href: "/map", icon: MapPin, label: "Mapa" },
  { href: "/account", icon: UserCircle, label: "Perfil" },
];

export function AppBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/businesses/")) {
    return null;
  }

  return (
    <nav
      aria-label="Navegacion principal movil"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand/10 bg-white/95 px-2 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_30px_rgba(11,31,61,0.12)] backdrop-blur-xl sm:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-extrabold transition-colors",
                isActive
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-[#FFF4E2] hover:text-foreground",
              )}
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
