export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
      };
      organization_members: {
        Row: {
          user_id: string;
          organization_id: string;
          role: "owner" | "manager" | "collaborator";
          created_at: string;
        };
        Insert: {
          user_id: string;
          organization_id: string;
          role: "owner" | "manager" | "collaborator";
          created_at?: string;
        };
        Update: {
          role?: "owner" | "manager" | "collaborator";
        };
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          address: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          address?: string | null;
          is_active?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string | null;
          audience_type: "organization" | "role" | "user";
          audience_role: "owner" | "manager" | "collaborator" | null;
          recipient_user_id: string | null;
          category: "summary" | "alert" | "digest" | "task";
          tone: "success" | "warning" | "danger";
          title: string;
          detail: string;
          href: string | null;
          metadata: Json;
          source_table: string | null;
          source_id: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id?: string | null;
          audience_type: "organization" | "role" | "user";
          audience_role?: "owner" | "manager" | "collaborator" | null;
          recipient_user_id?: string | null;
          category: "summary" | "alert" | "digest" | "task";
          tone: "success" | "warning" | "danger";
          title: string;
          detail: string;
          href?: string | null;
          metadata?: Json;
          source_table?: string | null;
          source_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          branch_id?: string | null;
          audience_type?: "organization" | "role" | "user";
          audience_role?: "owner" | "manager" | "collaborator" | null;
          recipient_user_id?: string | null;
          category?: "summary" | "alert" | "digest" | "task";
          tone?: "success" | "warning" | "danger";
          title?: string;
          detail?: string;
          href?: string | null;
          metadata?: Json;
          source_table?: string | null;
          source_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
        };
      };
      feedback_submissions: {
        Row: {
          id: string;
          branch_id: string;
          type: "complaint" | "suggestion" | "compliment" | "recommendation";
          emotion_score: number;
          csat_score: number | null;
          nps_score: number | null;
          free_text: string;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          consent_accepted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          type: "complaint" | "suggestion" | "compliment" | "recommendation";
          emotion_score: number;
          csat_score?: number | null;
          nps_score?: number | null;
          free_text: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          consent_accepted: boolean;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      ai_analyses: {
        Row: {
          id: string;
          submission_id: string;
          status: "completed" | "disabled" | "unavailable";
          sentiment: "positive" | "neutral" | "negative" | null;
          polarity: number | null;
          urgency: "low" | "medium" | "high" | "critical" | null;
          category: string | null;
          summary: string | null;
          recommended_action: string | null;
          keywords: string[];
          entities: string[];
          model_used: string | null;
          confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          status: "completed" | "disabled" | "unavailable";
          sentiment?: "positive" | "neutral" | "negative" | null;
          polarity?: number | null;
          urgency?: "low" | "medium" | "high" | "critical" | null;
          category?: string | null;
          summary?: string | null;
          recommended_action?: string | null;
          keywords?: string[];
          entities?: string[];
          model_used?: string | null;
          confidence?: number | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      listening_events: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string | null;
          user_id: string;
          level: "download" | "debate" | "empathetic_listening" | "generative_dialogue";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id?: string | null;
          user_id: string;
          level: "download" | "debate" | "empathetic_listening" | "generative_dialogue";
          note?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Functions: {
      user_organization_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      create_user_organization: {
        Args: {
          p_full_name: string;
          p_org_name: string;
          p_org_slug: string;
        };
        Returns: string;
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
