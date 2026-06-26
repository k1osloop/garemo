import Link from "next/link";

import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

type CategoryFilterProps = {
  categories: Category[];
  query?: string;
  selectedCategory?: string;
};

export function CategoryFilter({
  categories,
  query,
  selectedCategory,
}: CategoryFilterProps) {
  function buildHref(categorySlug?: string) {
    const params = new URLSearchParams();

    if (categorySlug) {
      params.set("category", categorySlug);
    }

    if (query) {
      params.set("q", query);
    }

    const queryString = params.toString();

    return queryString ? `/businesses?${queryString}` : "/businesses";
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Link
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
          !selectedCategory
            ? "border-brand bg-brand text-brand-foreground shadow-sm"
            : "border-border bg-surface text-muted-foreground hover:border-brand/50 hover:text-foreground hover:bg-slate-50",
        )}
        href={buildHref()}
      >
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
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
