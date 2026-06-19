import { MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";

type BusinessCardProps = {
  name: string;
  category: string;
  zone: string;
};

export function BusinessCard({ category, name, zone }: BusinessCardProps) {
  return (
    <Card className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-brand">
        {category}
      </p>
      <h2 className="text-base font-semibold">{name}</h2>
      <p className="flex items-center gap-1 text-sm text-muted">
        <MapPin className="h-4 w-4" />
        {zone}
      </p>
    </Card>
  );
}
