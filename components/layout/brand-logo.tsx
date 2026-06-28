import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  href?: string;
  showWordmark?: boolean;
};

export function BrandLogo({
  className,
  compact = false,
  href = "/",
  showWordmark = true,
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
          "h-auto w-auto object-contain drop-shadow-sm",
          compact ? "max-h-10" : "max-h-12",
          showWordmark ? "max-w-[170px] sm:max-w-[220px]" : "max-w-10",
        )}
        height={compact ? 40 : 44}
        priority
        src={
          showWordmark
            ? "/brand/garemo-wordmark.png"
            : "/brand/garemo-icon.png"
        }
        width={showWordmark ? 220 : 40}
      />
    </Link>
  );
}
