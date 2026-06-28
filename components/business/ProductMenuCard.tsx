import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { formatPrice, getProductImage } from "@/lib/business-display";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";

type ProductMenuCardProps = {
  product: Product;
};

export function ProductMenuCard({ product }: ProductMenuCardProps) {
  const imageUrl = getProductImage(product);
  const currentPrice = formatPrice(product.offer_price ?? product.price);
  const originalPrice =
    product.offer_price && product.price ? formatPrice(product.price) : null;

  return (
    <article className="flex min-w-0 gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-sm">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
        {imageUrl ? (
          <Image
            alt={product.name}
            className="h-full w-full object-cover"
            height={160}
            src={imageUrl}
            width={160}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
            {product.name}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
              product.is_available
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500",
            )}
          >
            {product.is_available ? "Disponible" : "Agotado"}
          </span>
        </div>
        {product.description ? (
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {product.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-end gap-2">
          {currentPrice ? (
            <span className="text-lg font-extrabold text-foreground">
              {currentPrice}
            </span>
          ) : null}
          {originalPrice ? (
            <span className="text-sm font-semibold text-muted-foreground line-through">
              {originalPrice}
            </span>
          ) : null}
          {product.stock_label ? (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
              {product.stock_label}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
