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
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link
        className={cn(
          "shrink-0 rounded-full border px-3 py-2 text-sm font-medium",
          !selectedCategory
            ? "border-brand bg-brand text-brand-foreground"
            : "border-border bg-surface text-muted",
        )}
        href="/businesses"
      >
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          className={cn(
            "shrink-0 rounded-full border px-3 py-2 text-sm font-medium",
            selectedCategory === category.slug
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border bg-surface text-muted",
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
