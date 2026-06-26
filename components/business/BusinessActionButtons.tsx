"use client";

import { Share2, Map, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type BusinessActionButtonsProps = {
  businessName: string;
  latitude: number | null;
  longitude: number | null;
};

export function BusinessActionButtons({ businessName, latitude, longitude }: BusinessActionButtonsProps) {
  const [copied, setCopied] = useState(false);

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
  const mapsUrl = hasLocation ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}` : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={handleShare} className="text-xs sm:text-sm h-9 px-3">
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Copiado" : "Compartir"}
      </Button>
      {mapsUrl && (
        <a 
          href={mapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs sm:text-sm font-medium transition-colors hover:bg-slate-50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 shadow-sm"
        >
          <Map className="h-4 w-4 text-brand" />
          Cómo llegar
        </a>
      )}
      <Button 
        variant="outline" 
        className="text-xs sm:text-sm h-9 px-3 text-brand border-brand/20 bg-brand/5 hover:bg-brand/10 hover:text-brand"
        onClick={() => alert("Chat en desarrollo (MVP). Pronto podrás enviar mensajes directos por aquí.")}
      >
        <span className="relative flex items-center gap-2">
          Chat
          <span className="flex h-2 w-2 rounded-full bg-brand"></span>
        </span>
      </Button>
    </div>
  );
}
