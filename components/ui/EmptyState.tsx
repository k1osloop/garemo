import { SearchX } from "lucide-react";

import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="space-y-3 border-dashed bg-surface/80 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-background text-brand">
        <SearchX className="h-5 w-5" />
      </div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-sm leading-6 text-muted">{description}</p>
    </Card>
  );
}
