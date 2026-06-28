import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  href?: string;
  showSlogan?: boolean;
  showWordmark?: boolean;
};

export function BrandLogo({
  className,
  compact = false,
  href = "/",
  showSlogan = false,
  showWordmark = true,
}: BrandLogoProps) {
  return (
    <Link
      aria-label="Garemo - Compra talento universitario"
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-2xl transition-opacity hover:opacity-90",
        className,
      )}
      href={href}
      prefetch={false}
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] bg-[#FFF4E2] shadow-sm ring-1 ring-brand/15",
          compact ? "h-9 w-9" : "h-10 w-10 sm:h-11 sm:w-11",
        )}
      >
        <Image
          alt=""
          className="h-full w-full object-contain"
          height={compact ? 36 : 44}
          priority
          src="/brand/icon.svg"
          width={compact ? 36 : 44}
        />
      </span>

      {showWordmark ? (
        <span className="min-w-0 leading-none">
          <span
            className={cn(
              "block font-black text-[#0B1F3D]",
              "font-[Arial_Rounded_MT_Bold,Trebuchet_MS,system-ui,sans-serif]",
              compact ? "text-lg" : "text-xl sm:text-2xl",
            )}
          >
            GAREMO
          </span>
          {showSlogan ? (
            <span className="mt-0.5 hidden text-[10px] font-semibold leading-none text-[#0B1F3D]/80 sm:block">
              Compra talento universitario
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
