import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/card";

type ErrorStateProps = {
  title: string;
  description: string;
};

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <Card className="space-y-2 border-red-200 bg-red-50 text-red-950">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <p className="text-sm leading-6 text-red-800">{description}</p>
    </Card>
  );
}
