export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          status: Database["public"]["Enums"]["business_status"];
          price_range: string | null;
          is_verified: boolean;
          status_message: string | null;
          opens_at: string | null;
          closes_at: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          status?: Database["public"]["Enums"]["business_status"];
          price_range?: string | null;
          is_verified?: boolean;
          status_message?: string | null;
          opens_at?: string | null;
          closes_at?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          status?: Database["public"]["Enums"]["business_status"];
          price_range?: string | null;
          is_verified?: boolean;
          status_message?: string | null;
          opens_at?: string | null;
          closes_at?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          price: number | null;
          offer_price: number | null;
          image_url: string | null;
          is_available: boolean;
          stock_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          price?: number | null;
          offer_price?: number | null;
          image_url?: string | null;
          is_available?: boolean;
          stock_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          offer_price?: number | null;
          image_url?: string | null;
          is_available?: boolean;
          stock_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          business_id: string;
          address_text: string;
          campus_zone: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          address_text: string;
          campus_zone?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          address_text?: string;
          campus_zone?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string;
          business_id: string;
          day_of_week: number;
          opens_at: string | null;
          closes_at: string | null;
          is_closed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          day_of_week: number;
          opens_at?: string | null;
          closes_at?: string | null;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          day_of_week?: number;
          opens_at?: string | null;
          closes_at?: string | null;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_images: {
        Row: {
          id: string;
          business_id: string;
          storage_path: string;
          public_url: string | null;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          storage_path: string;
          public_url?: string | null;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          storage_path?: string;
          public_url?: string | null;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      contact_info: {
        Row: {
          id: string;
          business_id: string;
          whatsapp_number: string;
          instagram_url: string | null;
          facebook_url: string | null;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          whatsapp_number: string;
          instagram_url?: string | null;
          facebook_url?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          whatsapp_number?: string;
          instagram_url?: string | null;
          facebook_url?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_review_business: {
        Args: {
          target_business_id: string;
          next_status: Database["public"]["Enums"]["business_status"];
          next_is_verified?: boolean;
          notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["businesses"]["Row"];
      };
      current_app_role: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["user_role"] | null;
      };
      is_admin_user: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      business_status:
        | "draft"
        | "pending_review"
        | "active"
        | "hidden"
        | "rejected";
      report_reason: "wrong_info" | "closed" | "duplicate" | "abuse" | "other";
      report_status: "open" | "reviewing" | "resolved" | "dismissed";
      user_role: "buyer" | "owner" | "admin";
      user_status: "active" | "disabled";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type Schedule = Database["public"]["Tables"]["schedules"]["Row"];
export type BusinessImage =
  Database["public"]["Tables"]["business_images"]["Row"];
export type ContactInfo =
  Database["public"]["Tables"]["contact_info"]["Row"];

export type PublicBusiness = Business & {
  category: Category | null;
  location: Location | null;
  schedules: Schedule[];
  images: BusinessImage[];
  contact_info: ContactInfo | null;
  products: Product[];
};
