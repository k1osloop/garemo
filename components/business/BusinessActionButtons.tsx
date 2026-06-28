"use client";

import { AlertTriangle, Check, Map, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/business/ReportModal";

type BusinessActionButtonsProps = {
  businessId: string;
  businessName: string;
  latitude: number | null;
  longitude: number | null;
};

export function BusinessActionButtons({
  businessId,
  businessName,
  latitude,
  longitude,
}: BusinessActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleShare = async () => {
    const shareData = {
      text: `Mira ${businessName} en Garemo`,
      title: businessName,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled native share.
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const mapsUrl =
    typeof latitude === "number" && typeof longitude === "number"
      ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      : undefined;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {mapsUrl ? (
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-slate-50"
            href={mapsUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Map className="h-4 w-4 text-brand" />
            <span className="hidden sm:inline">Como llegar</span>
          </a>
        ) : null}
        <Button
          className="min-h-11 rounded-2xl border-border bg-white px-3 text-sm font-bold shadow-sm"
          onClick={handleShare}
          type="button"
          variant="outline"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {copied ? "Copiado" : "Compartir"}
          </span>
        </Button>
        <Button
          className="min-h-11 rounded-2xl border-amber-200 bg-amber-50 px-3 text-sm font-bold text-amber-700 shadow-sm hover:bg-amber-100"
          onClick={() => setIsReportModalOpen(true)}
          type="button"
          variant="outline"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">Reportar</span>
        </Button>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetId={businessId}
        targetType="business"
      />
    </>
  );
}
