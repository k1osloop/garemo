"use client";

import { AlertTriangle, Check, Map, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

import { ReportModal } from "@/components/business/ReportModal";
import { Button } from "@/components/ui/button";

type StickyBottomBarProps = {
  businessId: string;
  businessName: string;
  latitude: number | null;
  longitude: number | null;
  whatsappUrl: string | null;
};

export function StickyBottomBar({
  businessId,
  businessName,
  latitude,
  longitude,
  whatsappUrl,
}: StickyBottomBarProps) {
  const [copied, setCopied] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleShare = async () => {
    const shareData = {
      text: `Conoce este emprendimiento en Garemo: ${businessName}`,
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
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
      {whatsappUrl ? (
        <a
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 text-base font-extrabold text-white shadow-md"
          href={whatsappUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </a>
      ) : null}

      {mapsUrl ? (
        <a
          aria-label="Como llegar"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-brand shadow-sm"
          href={mapsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Map className="h-5 w-5" />
        </a>
      ) : null}

      <Button
        aria-label="Compartir"
        className="h-12 w-12 shrink-0 rounded-2xl border-border bg-white px-0 shadow-sm"
        onClick={handleShare}
        variant="outline"
      >
        {copied ? (
          <Check className="h-5 w-5 text-emerald-600" />
        ) : (
          <Share2 className="h-5 w-5 text-slate-600" />
        )}
      </Button>

      <Button
        aria-label="Reportar problema"
        className="h-12 w-12 shrink-0 rounded-2xl border-amber-200 bg-amber-50 px-0 text-amber-700 shadow-sm hover:bg-amber-100"
        onClick={() => setIsReportModalOpen(true)}
        variant="outline"
      >
        <AlertTriangle className="h-5 w-5" />
      </Button>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetId={businessId}
        targetType="business"
      />
    </div>
  );
}
