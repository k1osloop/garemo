import Link from "next/link";

import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

type CategoryFilterProps = {
  categories: Category[];
  selectedCategory?: string;
};

export function CategoryFilter({
  categories,
  selectedCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        className={cn(
          "shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
          !selectedCategory
            ? "border-brand bg-brand text-brand-foreground"
            : "border-border bg-surface text-muted hover:border-brand hover:text-foreground",
        )}
        href="/businesses"
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
          href={`/businesses?category=${category.slug}`}
          key={category.id}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
