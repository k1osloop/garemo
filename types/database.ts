export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      business_status:
        | "draft"
        | "pending_review"
        | "active"
        | "hidden"
        | "rejected";
      event_type: "profile_view" | "whatsapp_click" | "search";
      report_reason: "wrong_info" | "closed" | "duplicate" | "abuse" | "other";
      report_status: "open" | "reviewing" | "resolved" | "dismissed";
      user_role: "buyer" | "owner" | "admin";
      user_status: "active" | "disabled";
    };
    CompositeTypes: Record<string, never>;
  };
};
