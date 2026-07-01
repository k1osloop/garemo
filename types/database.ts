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
      users_profile: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: Database["public"]["Enums"]["user_role"];
          phone: string | null;
          status: Database["public"]["Enums"]["user_status"];
          onboarding_completed: boolean;
          selected_role_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          phone?: string | null;
          status?: Database["public"]["Enums"]["user_status"];
          onboarding_completed?: boolean;
          selected_role_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          phone?: string | null;
          status?: Database["public"]["Enums"]["user_status"];
          onboarding_completed?: boolean;
          selected_role_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
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
          moderation_reason: string | null;
          moderation_status_message: string | null;
          suspended_at: string | null;
          reactivated_at: string | null;
          delivery_available: boolean;
          pickup_available: boolean;
          delivery_notes: string | null;
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
          moderation_reason?: string | null;
          moderation_status_message?: string | null;
          suspended_at?: string | null;
          reactivated_at?: string | null;
          delivery_available?: boolean;
          pickup_available?: boolean;
          delivery_notes?: string | null;
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
          moderation_reason?: string | null;
          moderation_status_message?: string | null;
          suspended_at?: string | null;
          reactivated_at?: string | null;
          delivery_available?: boolean;
          pickup_available?: boolean;
          delivery_notes?: string | null;
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
          image_path: string | null;
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
          image_path?: string | null;
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
          image_path?: string | null;
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
      business_reviews: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          status: string;
          moderation_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          status?: string;
          moderation_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          status?: string;
          moderation_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      whatsapp_clicks: {
        Row: {
          id: string;
          business_id: string;
          product_id: string | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          product_id?: string | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          product_id?: string | null;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_notifications: {
        Row: {
          id: string;
          user_id: string;
          business_id: string | null;
          type: string;
          title: string;
          message: string;
          status: "unread" | "read";
          metadata: Json;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id?: string | null;
          type: string;
          title: string;
          message: string;
          status?: "unread" | "read";
          metadata?: Json;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          status?: "unread" | "read";
          metadata?: Json;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          business_id: string;
          target_type: string;
          target_id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          details: string | null;
          description: string | null;
          status: Database["public"]["Enums"]["report_status"];
          admin_notes: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          business_id: string;
          target_type: string;
          target_id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          details?: string | null;
          description?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          admin_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          business_id?: string;
          target_type?: string;
          target_id?: string;
          reason?: Database["public"]["Enums"]["report_reason"];
          details?: string | null;
          description?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          admin_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          business_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          business_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          business_id?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      submit_report: {
        Args: {
          p_target_type: string;
          p_target_id: string;
          p_reason: Database["public"]["Enums"]["report_reason"];
          p_description?: string;
        };
        Returns: string;
      };
      admin_resolve_report: {
        Args: {
          p_report_id: string;
          p_next_status: Database["public"]["Enums"]["report_status"];
          p_notes?: string;
          p_business_status?: Database["public"]["Enums"]["business_status"] | null;
        };
        Returns: void;
      };
      admin_review_business: {
        Args: {
          target_business_id: string;
          next_status: Database["public"]["Enums"]["business_status"];
          next_is_verified?: boolean;
          notes?: string | null;
          reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["businesses"]["Row"];
      };
      admin_moderate_business: {
        Args: {
          target_business_id: string;
          next_status: Database["public"]["Enums"]["business_status"];
          notes?: string | null;
          reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["businesses"]["Row"];
      };
      create_user_notification: {
        Args: {
          target_user_id: string;
          target_business_id: string | null;
          notification_type: string;
          notification_title: string;
          notification_message: string;
          notification_metadata?: Json;
        };
        Returns: string;
      };
      mark_notification_read: {
        Args: {
          notification_id: string;
        };
        Returns: Database["public"]["Tables"]["user_notifications"]["Row"];
      };
      mark_all_my_notifications_read: {
        Args: Record<string, never>;
        Returns: number;
      };
      current_app_role: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["user_role"] | null;
      };
      is_registered_email: {
        Args: {
          candidate_email: string;
        };
        Returns: boolean;
      };
      get_admin_metrics: {
        Args: Record<string, never>;
        Returns: Json;
      };
      create_initial_user_profile: {
        Args: {
          requested_role: Database["public"]["Enums"]["user_role"];
          requested_full_name?: string | null;
        };
        Returns: Database["public"]["Tables"]["users_profile"]["Row"];
      };
      is_admin_user: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_public_business_trust_summaries: {
        Args: Record<string, never>;
        Returns: {
          business_id: string;
          average_rating: number | string | null;
          review_count: number;
          whatsapp_click_count: number;
        }[];
      };
      record_whatsapp_click: {
        Args: {
          target_business_id: string;
          target_product_id?: string | null;
          click_source?: string;
        };
        Returns: undefined;
      };
      become_owner: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      update_my_role: {
        Args: {
          selected_role: "buyer" | "owner";
        };
        Returns: Database["public"]["Tables"]["users_profile"]["Row"];
      };
      search_businesses: {
        Args: {
          p_query?: string;
          p_category_slug?: string | null;
        };
        Returns: Database["public"]["Tables"]["businesses"]["Row"][];
      };
    };
    Enums: {
      business_status:
        | "draft"
        | "pending_review"
        | "active"
        | "approved"
        | "hidden"
        | "rejected"
        | "under_review";
      report_reason: "inappropriate" | "scam" | "false_info" | "prohibited" | "duplicate" | "closed" | "abusive" | "spam" | "misleading" | "other";
      report_status: "open" | "reviewing" | "resolved" | "dismissed";
      user_role: "buyer" | "owner" | "admin";
      user_status: "active" | "disabled" | "under_review";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type UserProfile =
  Database["public"]["Tables"]["users_profile"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type Schedule = Database["public"]["Tables"]["schedules"]["Row"];
export type BusinessImage =
  Database["public"]["Tables"]["business_images"]["Row"];
export type ContactInfo =
  Database["public"]["Tables"]["contact_info"]["Row"];
export type BusinessReview =
  Database["public"]["Tables"]["business_reviews"]["Row"];
export type WhatsAppClick =
  Database["public"]["Tables"]["whatsapp_clicks"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type UserNotification =
  Database["public"]["Tables"]["user_notifications"]["Row"];

export type BusinessTrustSummary = {
  business_id: string;
  average_rating: number | null;
  review_count: number;
  whatsapp_click_count: number;
};

export type PublicBusiness = Business & {
  category: Category | null;
  location: Location | null;
  schedules: Schedule[];
  images: BusinessImage[];
  contact_info: ContactInfo | null;
  products: Product[];
  trust_summary: BusinessTrustSummary | null;
};
