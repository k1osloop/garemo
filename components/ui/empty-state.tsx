import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="space-y-2 border-dashed">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-sm leading-6 text-muted">{description}</p>
    </Card>
  );
}
