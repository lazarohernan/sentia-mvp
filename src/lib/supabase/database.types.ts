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
          logo_url: string | null;
          tagline: string | null;
          description: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          website_url: string | null;
          address: string | null;
          alert_escalation_phone: string | null;
          alert_escalation_email: string | null;
          peak_hours: string | null;
          service_priorities: string | null;
          compensation_policy: string | null;
          follow_up_tone: string | null;
          agent_notes: string | null;
          report_cadence: "weekly" | "monthly" | "both";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          tagline?: string | null;
          description?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          website_url?: string | null;
          address?: string | null;
          alert_escalation_phone?: string | null;
          alert_escalation_email?: string | null;
          peak_hours?: string | null;
          service_priorities?: string | null;
          compensation_policy?: string | null;
          follow_up_tone?: string | null;
          agent_notes?: string | null;
          report_cadence?: "weekly" | "monthly" | "both";
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          tagline?: string | null;
          description?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          alert_escalation_phone?: string | null;
          alert_escalation_email?: string | null;
          website_url?: string | null;
          address?: string | null;
          peak_hours?: string | null;
          service_priorities?: string | null;
          compensation_policy?: string | null;
          follow_up_tone?: string | null;
          agent_notes?: string | null;
          report_cadence?: "weekly" | "monthly" | "both";
        };
      };
      organization_members: {
        Row: {
          user_id: string;
          organization_id: string;
          branch_id: string | null;
          organization_role_id: string | null;
          role: "owner" | "manager" | "collaborator";
          created_at: string;
        };
        Insert: {
          user_id: string;
          organization_id: string;
          branch_id?: string | null;
          organization_role_id?: string | null;
          role: "owner" | "manager" | "collaborator";
          created_at?: string;
        };
        Update: {
          branch_id?: string | null;
          organization_role_id?: string | null;
          role?: "owner" | "manager" | "collaborator";
        };
      };
      organization_roles: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          permissions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          permissions: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          permissions?: string[];
          updated_at?: string;
        };
      };
      organization_listening_settings: {
        Row: {
          organization_id: string;
          reminders_enabled: boolean;
          reminder_times: string[];
          reminder_weekdays: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          reminders_enabled?: boolean;
          reminder_times?: string[];
          reminder_weekdays?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          reminders_enabled?: boolean;
          reminder_times?: string[];
          reminder_weekdays?: string[];
          updated_at?: string;
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
      branch_qr_scans: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          source?: string;
          created_at?: string;
        };
        Update: Record<string, never>;
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
      push_subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          endpoint: string;
          subscription: Json;
          user_agent: string | null;
          device_label: string | null;
          last_seen_at: string;
          last_success_at: string | null;
          last_error_at: string | null;
          disabled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          endpoint: string;
          subscription: Json;
          user_agent?: string | null;
          device_label?: string | null;
          last_seen_at?: string;
          last_success_at?: string | null;
          last_error_at?: string | null;
          disabled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          endpoint?: string;
          subscription?: Json;
          user_agent?: string | null;
          device_label?: string | null;
          last_seen_at?: string;
          last_success_at?: string | null;
          last_error_at?: string | null;
          disabled_at?: string | null;
          updated_at?: string;
        };
      };
      improvement_narratives: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          branch_name: string;
          period: "7d" | "30d";
          title: string;
          narrative: string;
          urgency: "urgente" | "esta semana" | "próximo ciclo";
          generated_by_llm: boolean;
          actor_user_id: string | null;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          branch_name: string;
          period: "7d" | "30d";
          title: string;
          narrative: string;
          urgency: "urgente" | "esta semana" | "próximo ciclo";
          generated_by_llm?: boolean;
          actor_user_id?: string | null;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_name?: string;
          title?: string;
          narrative?: string;
          urgency?: "urgente" | "esta semana" | "próximo ciclo";
          generated_by_llm?: boolean;
          actor_user_id?: string | null;
          generated_at?: string;
          updated_at?: string;
        };
      };
      improvement_weekly_digests: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          branch_name: string;
          window_key: string;
          window_label: string;
          period_start: string;
          period_end: string;
          digest: Json;
          title: string;
          narrative: string;
          urgency: "urgente" | "esta semana" | "próximo ciclo";
          comment_count: number;
          comment_fingerprint: string;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          branch_name: string;
          window_key: string;
          window_label: string;
          period_start: string;
          period_end: string;
          digest?: Json;
          title: string;
          narrative: string;
          urgency: "urgente" | "esta semana" | "próximo ciclo";
          comment_count?: number;
          comment_fingerprint: string;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_name?: string;
          window_label?: string;
          digest?: Json;
          title?: string;
          narrative?: string;
          urgency?: "urgente" | "esta semana" | "próximo ciclo";
          comment_count?: number;
          comment_fingerprint?: string;
          generated_at?: string;
          updated_at?: string;
        };
      };
      agent_reports: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string | null;
          actor_user_id: string | null;
          report_type: "operational_report";
          period: "7d" | "30d";
          headline: string;
          summary: string;
          next_actions: Json;
          delivery_readiness: string;
          context: Json;
          generated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id?: string | null;
          actor_user_id?: string | null;
          report_type?: "operational_report";
          period: "7d" | "30d";
          headline: string;
          summary: string;
          next_actions?: Json;
          delivery_readiness: string;
          context?: Json;
          generated_at: string;
          created_at?: string;
        };
        Update: Record<string, never>;
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
          workflow_status:
            | "nuevo"
            | "en_revision"
            | "en_proceso"
            | "resuelto"
            | "escalado";
          assigned_user_id: string | null;
          first_response_at: string | null;
          resolved_at: string | null;
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
          workflow_status?:
            | "nuevo"
            | "en_revision"
            | "en_proceso"
            | "resuelto"
            | "escalado";
          assigned_user_id?: string | null;
          first_response_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          workflow_status?:
            | "nuevo"
            | "en_revision"
            | "en_proceso"
            | "resuelto"
            | "escalado";
          assigned_user_id?: string | null;
          first_response_at?: string | null;
          resolved_at?: string | null;
        };
      };
      feedback_follow_up_actions: {
        Row: {
          id: string;
          submission_id: string;
          organization_id: string;
          actor_user_id: string | null;
          action_type: "status_change" | "note" | "assignment" | "escalation";
          previous_status: string | null;
          new_status: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          organization_id: string;
          actor_user_id: string;
          action_type: "status_change" | "note" | "assignment" | "escalation";
          previous_status?: string | null;
          new_status?: string | null;
          note?: string | null;
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
          probable_cause: string | null;
          recommended_action: string | null;
          suggested_owner: string | null;
          suggested_sla: string | null;
          requires_contact: boolean | null;
          information_quality: "sufficient" | "partial" | "insufficient" | null;
          follow_up_question: string | null;
          follow_up_answer: string | null;
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
          probable_cause?: string | null;
          recommended_action?: string | null;
          suggested_owner?: string | null;
          suggested_sla?: string | null;
          requires_contact?: boolean | null;
          information_quality?: "sufficient" | "partial" | "insufficient" | null;
          follow_up_question?: string | null;
          follow_up_answer?: string | null;
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
          user_id: string | null;
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
