import Link from "next/link";
import { Sparkles, Bike, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

type CategoryFilterProps = {
  categories: Category[];
  query?: string;
  selectedCategory?: string;
  selectedFeatures?: {
    delivery?: boolean;
    offers?: boolean;
    open?: boolean;
  };
};

export function CategoryFilter({
  categories,
  query,
  selectedCategory,
  selectedFeatures = {},
}: CategoryFilterProps) {
  function buildHref(categorySlug?: string, toggleFeature?: "delivery" | "offers" | "open") {
    const params = new URLSearchParams();

    if (categorySlug === undefined) {
      if (selectedCategory) params.set("category", selectedCategory);
    } else if (categorySlug !== "") {
      params.set("category", categorySlug);
    }

    if (query) params.set("q", query);

    let d = selectedFeatures.delivery;
    let o = selectedFeatures.offers;
    let op = selectedFeatures.open;

    if (toggleFeature === "delivery") d = !d;
    if (toggleFeature === "offers") o = !o;
    if (toggleFeature === "open") op = !op;

    if (d) params.set("delivery", "true");
    if (o) params.set("offers", "true");
    if (op) params.set("open", "true");

    const queryString = params.toString();
    return queryString ? `/businesses?${queryString}` : "/businesses";
  }

  const isAll = !selectedCategory && !selectedFeatures.delivery && !selectedFeatures.offers && !selectedFeatures.open;

  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      <Link
        className={cn(
          "shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
          isAll
            ? "border-brand bg-brand text-brand-foreground shadow-sm"
            : "border-border bg-surface text-muted-foreground hover:border-brand/50 hover:text-foreground hover:bg-slate-50",
        )}
        href="/businesses"
      >
        Todos
      </Link>
      
      <Link
        className={cn(
          "shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
          selectedFeatures.offers
            ? "border-accent bg-accent text-accent-foreground shadow-sm"
            : "border-border bg-surface text-muted-foreground hover:border-accent/50 hover:text-foreground hover:bg-slate-50",
        )}
        href={buildHref(undefined, "offers")}
      >
        <Sparkles className="h-4 w-4" />
        Promos
      </Link>

      <Link
        className={cn(
          "shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
          selectedFeatures.delivery
            ? "border-brand bg-brand text-brand-foreground shadow-sm"
            : "border-border bg-surface text-muted-foreground hover:border-brand/50 hover:text-foreground hover:bg-slate-50",
        )}
        href={buildHref(undefined, "delivery")}
      >
        <Bike className="h-4 w-4" />
        Delivery
      </Link>

      <Link
        className={cn(
          "shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
          selectedFeatures.open
            ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
            : "border-border bg-surface text-muted-foreground hover:border-emerald-500/50 hover:text-foreground hover:bg-slate-50",
        )}
        href={buildHref(undefined, "open")}
      >
        <Clock3 className="h-4 w-4" />
        Abierto ahora
      </Link>

      <div className="w-px h-8 bg-border shrink-0 mx-1 hidden sm:block"></div>

      {categories.map((category) => (
        <Link
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
            selectedCategory === category.slug
              ? "border-brand bg-brand text-brand-foreground shadow-sm"
              : "border-border bg-surface text-muted-foreground hover:border-brand/50 hover:text-foreground hover:bg-slate-50",
          )}
          href={buildHref(category.slug)}
          key={category.id}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
