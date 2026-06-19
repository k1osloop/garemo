import { MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";

export function BusinessMapPlaceholder() {
  return (
    <Card className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
      <MapPin className="h-10 w-10 text-brand" />
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Mapa pendiente</h2>
        <p className="text-sm leading-6 text-muted">
          Leaflet y React Leaflet estan instalados. El mapa real se conectara
          cuando existan ubicaciones validadas.
        </p>
      </div>
    </Card>
  );
}
