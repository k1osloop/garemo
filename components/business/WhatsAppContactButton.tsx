"use client";

import { MessageCircle } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type WhatsAppContactButtonProps = {
  businessId: string;
  href: string;
  productId?: string | null;
  source?: string;
};

export function WhatsAppContactButton({
  businessId,
  href,
  productId = null,
  source = "business_detail",
}: WhatsAppContactButtonProps) {
  async function recordClick() {
    const supabase = createSupabaseBrowserClient();

    await supabase.rpc("record_whatsapp_click", {
      target_business_id: businessId,
      target_product_id: productId,
      click_source: source,
    });
  }

  return (
    <a
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-teal-800"
      href={href}
      onClick={() => {
        void recordClick();
      }}
      rel="noreferrer"
      target="_blank"
    >
      <MessageCircle className="h-4 w-4" />
      Contactar por WhatsApp
    </a>
  );
}
