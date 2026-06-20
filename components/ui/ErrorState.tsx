import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/card";

type ErrorStateProps = {
  title: string;
  description: string;
};

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <Card className="space-y-3 border-red-200 bg-red-50 text-red-950">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-sm leading-6 text-red-800">{description}</p>
        </div>
      </div>
    </Card>
  );
}
