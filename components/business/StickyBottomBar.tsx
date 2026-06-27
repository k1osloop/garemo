"use client";

import { MessageCircle, Map, Share2, AlertTriangle, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportModal } from "./ReportModal";

type StickyBottomBarProps = {
  businessId: string;
  businessName: string;
  whatsappUrl: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function StickyBottomBar({
  businessId,
  businessName,
  whatsappUrl,
  latitude,
  longitude,
}: StickyBottomBarProps) {
  const [copied, setCopied] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: businessName,
      text: `Mira ${businessName} en Garemo`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasLocation = typeof latitude === "number" && typeof longitude === "number";
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : undefined;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-2 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden pb-safe">
      <div className="flex flex-1 items-center gap-2">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-base font-bold text-white transition-all hover:bg-[#1EBE5D] hover:scale-[1.02] shadow-md"
          >
            <MessageCircle className="h-5 w-5 fill-white text-white" />
            <span>WhatsApp</span>
          </a>
        ) : null}

        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-brand transition-colors hover:bg-slate-50 shadow-sm"
            aria-label="Cómo llegar"
          >
            <Map className="h-5 w-5" />
          </a>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          className="h-11 w-11 shrink-0 rounded-xl px-0 border-border bg-surface shadow-sm"
          onClick={handleShare}
          aria-label="Compartir"
        >
          {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5 text-slate-600" />}
        </Button>

        <Button
          variant="outline"
          className="h-11 w-11 shrink-0 rounded-xl px-0 border-red-200 bg-red-50 hover:bg-red-100 shadow-sm"
          onClick={() => setIsReportModalOpen(true)}
          aria-label="Reportar"
        >
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </Button>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetId={businessId}
        targetType="business"
      />
    </div>
  );
}
