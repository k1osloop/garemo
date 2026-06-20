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
    <div className="flex flex-wrap gap-2">
      <Link
        className={cn(
          "shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
          !selectedCategory
            ? "border-brand bg-brand text-brand-foreground"
            : "border-border bg-surface text-muted hover:border-brand hover:text-foreground",
        )}
        href={buildHref()}
      >
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          className={cn(
            "shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
            selectedCategory === category.slug
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border bg-surface text-muted hover:border-brand hover:text-foreground",
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
