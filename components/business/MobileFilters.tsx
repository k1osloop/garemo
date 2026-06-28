"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Bike, Clock3, Search, Sparkles, X } from "lucide-react";
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

      const queryString = params.toString();
      router.push(queryString ? `/businesses?${queryString}` : "/businesses");
    },
    [router, searchParams],
  );

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateFilters({ q: query || null });
  };

  const clearSearch = () => {
    setQuery("");
    updateFilters({ q: null });
  };

  const isAllSelected = !selectedCategory && !delivery && !offers && !open;

  return (
    <div className="space-y-3">
      <form className="relative" onSubmit={handleSearch}>
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" />
        <input
          className="h-14 w-full rounded-2xl border border-border bg-white pl-12 pr-12 text-base font-medium shadow-sm outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/15"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="¿Qué estás buscando hoy?"
          type="search"
          value={query}
        />
        {query ? (
          <button
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500"
            onClick={clearSearch}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <button
          className={cn(
            "min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition-all duration-200",
            isAllSelected
              ? "border-brand bg-brand text-brand-foreground shadow-sm"
              : "border-border bg-white text-muted-foreground hover:border-brand/50 hover:bg-slate-50",
          )}
          onClick={() => {
            const params = new URLSearchParams();
            if (query) {
              params.set("q", query);
            }
            router.push(params.toString() ? `/businesses?${params}` : "/businesses");
          }}
          type="button"
        >
          Todos
        </button>

        <button
          className={cn(
            "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-all duration-200",
            offers
              ? "border-accent bg-accent text-accent-foreground shadow-sm"
              : "border-border bg-white text-muted-foreground hover:border-accent/50 hover:bg-slate-50",
          )}
          onClick={() => updateFilters({ offers: offers ? null : "true" })}
          type="button"
        >
          <Sparkles className="h-4 w-4" />
          Promos
        </button>

        <button
          className={cn(
            "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-all duration-200",
            delivery
              ? "border-brand bg-brand text-brand-foreground shadow-sm"
              : "border-border bg-white text-muted-foreground hover:border-brand/50 hover:bg-slate-50",
          )}
          onClick={() => updateFilters({ delivery: delivery ? null : "true" })}
          type="button"
        >
          <Bike className="h-4 w-4" />
          Delivery
        </button>

        <button
          className={cn(
            "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-all duration-200",
            open
              ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
              : "border-border bg-white text-muted-foreground hover:border-emerald-500/50 hover:bg-slate-50",
          )}
          onClick={() => updateFilters({ open: open ? null : "true" })}
          type="button"
        >
          <Clock3 className="h-4 w-4" />
          Abierto ahora
        </button>

        {categories.map((category) => (
          <button
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition-all duration-200",
              selectedCategory === category.slug
                ? "border-brand bg-brand text-brand-foreground shadow-sm"
                : "border-border bg-white text-muted-foreground hover:border-brand/50 hover:bg-slate-50",
            )}
            key={category.id}
            onClick={() =>
              updateFilters({
                category:
                  selectedCategory === category.slug ? null : category.slug,
              })
            }
            type="button"
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
