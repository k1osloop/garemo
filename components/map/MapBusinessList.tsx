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
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="grid gap-3">
        {businesses.map((business) => {
          const locationText =
            business.location?.campus_zone ??
            business.location?.address_text ??
            "Ubicacion por confirmar";

          return (
            <Link href={`/businesses/${business.id}`} key={business.id}>
              <Card className="space-y-2 transition-colors hover:border-brand">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">
                      {business.name}
                    </h3>
                    <p className="text-xs text-brand">
                      {business.category?.name ?? "Categoria"}
                    </p>
                  </div>
                  <MapPin className="h-4 w-4 shrink-0 text-brand" />
                </div>
                <p className="text-sm leading-6 text-muted">{locationText}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
