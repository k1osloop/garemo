import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  href?: string;
};

export function BrandLogo({
  className,
  compact = false,
  href = "/",
}: BrandLogoProps) {
  return (
    <Link
      aria-label="Garemo - Compra talento universitario"
      className={cn(
        "inline-flex min-w-0 items-center rounded-2xl transition-opacity hover:opacity-90",
        className,
      )}
      href={href}
      prefetch={false}
    >
      <Image
        alt="Garemo"
        className={cn(
          "h-auto w-auto drop-shadow-sm",
          compact ? "max-h-10" : "max-h-11",
        )}
        height={compact ? 40 : 44}
        priority
        src={compact ? "/brand/icon.svg" : "/brand/logo.svg"}
        width={compact ? 40 : 150}
      />
    </Link>
  );
}
