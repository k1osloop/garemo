import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

export default function BusinessesLoading() {
  return (
    <PageShell>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-border" />
          <div className="h-8 w-64 rounded bg-border" />
          <div className="h-4 w-full rounded bg-border" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-full bg-border" />
          <div className="h-9 w-28 rounded-full bg-border" />
          <div className="h-9 w-24 rounded-full bg-border" />
        </div>
        <Card className="space-y-3">
          <div className="h-4 w-24 rounded bg-border" />
          <div className="h-6 w-48 rounded bg-border" />
          <div className="h-4 w-full rounded bg-border" />
        </Card>
      </div>
    </PageShell>
  );
}
