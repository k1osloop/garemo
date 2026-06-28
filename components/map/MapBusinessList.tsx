import Link from "next/link";
import { MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { PublicBusiness } from "@/types/database";

type MapBusinessListProps = {
  businesses: PublicBusiness[];
  title: string;
};

export function MapBusinessList({ businesses, title }: MapBusinessListProps) {
  if (businesses.length === 0) {
    return null;
  }

  return (
    <section className="min-w-0 space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => {
          const locationText =
            business.location?.campus_zone ??
            business.location?.address_text ??
            "Ubicacion por confirmar";

          return (
            <Link
              className="block min-w-0"
              href={`/businesses/${business.id}`}
              key={business.id}
            >
              <Card className="h-full min-w-0 space-y-2 transition-colors hover:border-brand hover:shadow-sm">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {business.name}
                    </h3>
                    <p className="text-xs text-brand">
                      {business.category?.name ?? "Categoria"}
                    </p>
                  </div>
                  <MapPin className="h-4 w-4 shrink-0 text-brand" />
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-muted">
                  {locationText}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
