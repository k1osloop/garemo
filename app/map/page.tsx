import { PageShell } from "@/components/layout/page-shell";
import { BusinessMapPlaceholder } from "@/components/map/business-map-placeholder";

export default function MapPage() {
  return (
    <PageShell title="Mapa">
      <BusinessMapPlaceholder />
    </PageShell>
  );
}
