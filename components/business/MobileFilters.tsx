"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

type MobileFiltersProps = {
  categories: Category[];
  initialQuery?: string;
};

export function MobileFilters({
  categories,
  initialQuery = "",
}: MobileFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  const selectedCategory = searchParams.get("category");
  const delivery = searchParams.get("delivery") === "true";
  const pickup = searchParams.get("pickup") === "true";
  const offers = searchParams.get("offers") === "true";
  const open = searchParams.get("open") === "true";

  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      
      router.push(`/businesses?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: query || null });
  };

  const isAllSelected = !selectedCategory && !delivery && !pickup && !offers && !open;

  return (
    <div className="sticky top-16 z-30 -mx-4 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 border-b border-border space-y-3">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-surface text-base outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-sm"
          placeholder="¿Qué estás buscando hoy?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
        />
      </form>

      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => {
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            router.push(`/businesses?${params.toString()}`);
          }}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 border",
            isAllSelected
              ? "border-brand bg-brand text-brand-foreground shadow-sm"
              : "border-border bg-surface text-muted-foreground hover:border-brand/50 hover:bg-slate-50"
          )}
        >
          Todos
        </button>

        <button
          onClick={() => updateFilters({ offers: offers ? null : "true" })}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 border",
            offers
              ? "border-brand bg-brand text-brand-foreground shadow-sm"
              : "border-border bg-surface text-muted-foreground hover:border-brand/50 hover:bg-slate-50"
          )}
        >
          🏷️ Promos
        </button>

        <button
          onClick={() => updateFilters({ delivery: delivery ? null : "true" })}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 border",
            delivery
              ? "border-brand bg-brand text-brand-foreground shadow-sm"
              : "border-border bg-surface text-muted-foreground hover:border-brand/50 hover:bg-slate-50"
          )}
        >
          🛵 Delivery
        </button>

        <button
          onClick={() => updateFilters({ open: open ? null : "true" })}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 border",
            open
              ? "border-brand bg-brand text-brand-foreground shadow-sm"
              : "border-border bg-surface text-muted-foreground hover:border-brand/50 hover:bg-slate-50"
          )}
        >
          🟢 Abierto ahora
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => updateFilters({ category: selectedCategory === category.slug ? null : category.slug })}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 border",
              selectedCategory === category.slug
                ? "border-brand bg-brand text-brand-foreground shadow-sm"
                : "border-border bg-surface text-muted-foreground hover:border-brand/50 hover:bg-slate-50"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
