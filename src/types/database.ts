export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activation_events: {
        Row: {
          event_type: string
          id: string
          idempotency_key: string
          occurred_at: string
          properties: Json
          user_id: string
        }
        Insert: {
          event_type: string
          id?: string
          idempotency_key: string
          occurred_at?: string
          properties?: Json
          user_id: string
        }
        Update: {
          event_type?: string
          id?: string
          idempotency_key?: string
          occurred_at?: string
          properties?: Json
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          bucket: string
          content_sha256: string | null
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          file_size_bytes: number
          height: number | null
          id: string
          kind: string
          mime_type: string
          pinned_at: string | null
          status: string
          storage_key: string
          storage_provider: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          bucket: string
          content_sha256?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          file_size_bytes: number
          height?: number | null
          id?: string
          kind: string
          mime_type: string
          pinned_at?: string | null
          status?: string
          storage_key: string
          storage_provider: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          bucket?: string
          content_sha256?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string
          pinned_at?: string | null
          status?: string
          storage_key?: string
          storage_provider?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      beta_invites: {
        Row: {
          code_hash: string
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string | null
          id: string
          max_uses: number
          status: string
          updated_at: string
          use_count: number
        }
        Insert: {
          code_hash: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          status?: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          code_hash?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          status?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          created_at: string
          id: string
          livemode: boolean
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          livemode: boolean
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          livemode?: boolean
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          business_monthly_credits: number
          free_signup_credits: number
          id: boolean
          pro_monthly_credits: number
          updated_at: string
        }
        Insert: {
          business_monthly_credits?: number
          free_signup_credits?: number
          id?: boolean
          pro_monthly_credits?: number
          updated_at?: string
        }
        Update: {
          business_monthly_credits?: number
          free_signup_credits?: number
          id?: boolean
          pro_monthly_credits?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing_revenue_events: {
        Row: {
          created_at: string
          credits_granted: number
          currency: string
          gross_amount_minor: number
          gross_revenue_per_credit_usd: number | null
          id: string
          paid_at: string
          plan_key: string
          stripe_invoice_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_granted: number
          currency: string
          gross_amount_minor: number
          gross_revenue_per_credit_usd?: number | null
          id?: string
          paid_at: string
          plan_key: string
          stripe_invoice_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_granted?: number
          currency?: string
          gross_amount_minor?: number
          gross_revenue_per_credit_usd?: number | null
          id?: string
          paid_at?: string
          plan_key?: string
          stripe_invoice_id?: string
          user_id?: string
        }
        Relationships: []
      }
      checkout_consents: {
        Row: {
          accepted: boolean
          accepted_at: string
          billing_period: string
          client_request_id: string
          completed_at: string | null
          consent_version: string
          id: string
          public_plan: string
          refund_policy_version: string
          stripe_checkout_session_id: string | null
          terms_version: string
          user_id: string
        }
        Insert: {
          accepted: boolean
          accepted_at?: string
          billing_period: string
          client_request_id: string
          completed_at?: string | null
          consent_version: string
          id?: string
          public_plan: string
          refund_policy_version: string
          stripe_checkout_session_id?: string | null
          terms_version: string
          user_id: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          billing_period?: string
          client_request_id?: string
          completed_at?: string | null
          consent_version?: string
          id?: string
          public_plan?: string
          refund_policy_version?: string
          stripe_checkout_session_id?: string | null
          terms_version?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_style_references: {
        Row: {
          content_hash: string
          created_at: string
          file_size: number
          height: number | null
          id: string
          mime_type: string
          original_filename: string
          position: number
          storage_path: string
          style_id: string
          user_id: string
          width: number | null
        }
        Insert: {
          content_hash: string
          created_at?: string
          file_size: number
          height?: number | null
          id?: string
          mime_type: string
          original_filename: string
          position: number
          storage_path: string
          style_id: string
          user_id: string
          width?: number | null
        }
        Update: {
          content_hash?: string
          created_at?: string
          file_size?: number
          height?: number | null
          id?: string
          mime_type?: string
          original_filename?: string
          position?: number
          storage_path?: string
          style_id?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_style_references_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "brand_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_styles: {
        Row: {
          analysis_status: string
          consistency_score: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          supported_design_types: string[]
          updated_at: string
          user_id: string
          visual_attributes: Json | null
          visual_summary: string | null
          warnings: Json
        }
        Insert: {
          analysis_status?: string
          consistency_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          supported_design_types?: string[]
          updated_at?: string
          user_id: string
          visual_attributes?: Json | null
          visual_summary?: string | null
          warnings?: Json
        }
        Update: {
          analysis_status?: string
          consistency_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          supported_design_types?: string[]
          updated_at?: string
          user_id?: string
          visual_attributes?: Json | null
          visual_summary?: string | null
          warnings?: Json
        }
        Relationships: []
      }
      credit_accounts: {
        Row: {
          available_balance: number
          lifetime_consumed: number
          lifetime_granted: number
          reserved_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          lifetime_consumed?: number
          lifetime_granted?: number
          reserved_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          lifetime_consumed?: number
          lifetime_granted?: number
          reserved_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_grants: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          initial_amount: number
          remaining_amount: number
          reserved_amount: number
          source_reference: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          initial_amount: number
          remaining_amount: number
          reserved_amount?: number
          source_reference?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          initial_amount?: number
          remaining_amount?: number
          reserved_amount?: number
          source_reference?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_reservation_items: {
        Row: {
          amount: number
          grant_id: string
          reservation_id: string
        }
        Insert: {
          amount: number
          grant_id: string
          reservation_id: string
        }
        Update: {
          amount?: number
          grant_id?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_reservation_items_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "credit_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "credit_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_reservations: {
        Row: {
          amount: number
          created_at: string
          finalized_at: string | null
          id: string
          idempotency_key: string
          reference_id: string
          reference_type: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          finalized_at?: string | null
          id?: string
          idempotency_key: string
          reference_id: string
          reference_type: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          finalized_at?: string | null
          id?: string
          idempotency_key?: string
          reference_id?: string
          reference_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string
          grant_id: string | null
          id: string
          idempotency_key: string | null
          reference_id: string | null
          reference_type: string | null
          reservation_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description: string
          grant_id?: string | null
          id?: string
          idempotency_key?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reservation_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string
          grant_id?: string | null
          id?: string
          idempotency_key?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reservation_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "credit_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "credit_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
          version_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id: string
          version_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edit_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "edit_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_messages_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "edit_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_sessions: {
        Row: {
          created_at: string
          current_version_id: string | null
          id: string
          previous_response_id: string | null
          project_id: string | null
          source_generation_id: string | null
          source_upload_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_version_id?: string | null
          id?: string
          previous_response_id?: string | null
          project_id?: string | null
          source_generation_id?: string | null
          source_upload_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_version_id?: string | null
          id?: string
          previous_response_id?: string | null
          project_id?: string | null
          source_generation_id?: string | null
          source_upload_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edit_sessions_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "edit_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_sessions_source_generation_id_fkey"
            columns: ["source_generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_sessions_source_upload_id_fkey"
            columns: ["source_upload_id"]
            isOneToOne: false
            referencedRelation: "user_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_versions: {
        Row: {
          asset_id: string | null
          client_request_id: string | null
          completed_at: string | null
          created_at: string
          credit_cost: number | null
          credit_reservation_id: string | null
          credit_transaction_id: string | null
          enhanced_instruction: string | null
          error_code: string | null
          height: number | null
          id: string
          instruction: string | null
          mime_type: string | null
          model: string | null
          parent_version_id: string | null
          preserve_composition: boolean
          preview_asset_id: string | null
          provider_response_id: string | null
          session_id: string
          source_generation_id: string | null
          source_upload_id: string | null
          status: string
          storage_path: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          asset_id?: string | null
          client_request_id?: string | null
          completed_at?: string | null
          created_at?: string
          credit_cost?: number | null
          credit_reservation_id?: string | null
          credit_transaction_id?: string | null
          enhanced_instruction?: string | null
          error_code?: string | null
          height?: number | null
          id?: string
          instruction?: string | null
          mime_type?: string | null
          model?: string | null
          parent_version_id?: string | null
          preserve_composition?: boolean
          preview_asset_id?: string | null
          provider_response_id?: string | null
          session_id: string
          source_generation_id?: string | null
          source_upload_id?: string | null
          status?: string
          storage_path?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          asset_id?: string | null
          client_request_id?: string | null
          completed_at?: string | null
          created_at?: string
          credit_cost?: number | null
          credit_reservation_id?: string | null
          credit_transaction_id?: string | null
          enhanced_instruction?: string | null
          error_code?: string | null
          height?: number | null
          id?: string
          instruction?: string | null
          mime_type?: string | null
          model?: string | null
          parent_version_id?: string | null
          preserve_composition?: boolean
          preview_asset_id?: string | null
          provider_response_id?: string | null
          session_id?: string
          source_generation_id?: string | null
          source_upload_id?: string | null
          status?: string
          storage_path?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edit_versions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_versions_credit_reservation_id_fkey"
            columns: ["credit_reservation_id"]
            isOneToOne: false
            referencedRelation: "credit_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_versions_credit_transaction_id_fkey"
            columns: ["credit_transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "edit_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_versions_preview_asset_id_fkey"
            columns: ["preview_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_versions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "edit_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_versions_source_generation_id_fkey"
            columns: ["source_generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_versions_source_upload_id_fkey"
            columns: ["source_upload_id"]
            isOneToOne: false
            referencedRelation: "user_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_deliveries: {
        Row: {
          attempt_count: number
          bounced_at: string | null
          complained_at: string | null
          created_at: string
          delivered_at: string | null
          email_type: string
          id: string
          idempotency_key: string
          last_error_code: string | null
          provider: string
          provider_message_id: string | null
          recipient_hash: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempt_count?: number
          bounced_at?: string | null
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email_type: string
          id?: string
          idempotency_key: string
          last_error_code?: string | null
          provider?: string
          provider_message_id?: string | null
          recipient_hash?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempt_count?: number
          bounced_at?: string | null
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email_type?: string
          id?: string
          idempotency_key?: string
          last_error_code?: string | null
          provider?: string
          provider_message_id?: string | null
          recipient_hash?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      generation_events: {
        Row: {
          duration_ms: number | null
          event_type: string
          generation_id: string
          id: string
          idempotency_key: string
          job_id: string | null
          occurred_at: string
          properties: Json
          user_id: string
        }
        Insert: {
          duration_ms?: number | null
          event_type: string
          generation_id: string
          id?: string
          idempotency_key: string
          job_id?: string | null
          occurred_at?: string
          properties?: Json
          user_id: string
        }
        Update: {
          duration_ms?: number | null
          event_type?: string
          generation_id?: string
          id?: string
          idempotency_key?: string
          job_id?: string | null
          occurred_at?: string
          properties?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_events_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_feedback: {
        Row: {
          automatic_evaluation_snapshot: Json
          comment: string | null
          configuration_snapshot: Json
          correction_request: string | null
          correction_requested: boolean
          created_at: string
          generation_id: string
          id: string
          reasons: string[]
          updated_at: string
          user_id: string
          verdict: string
        }
        Insert: {
          automatic_evaluation_snapshot?: Json
          comment?: string | null
          configuration_snapshot: Json
          correction_request?: string | null
          correction_requested?: boolean
          created_at?: string
          generation_id: string
          id?: string
          reasons?: string[]
          updated_at?: string
          user_id: string
          verdict: string
        }
        Update: {
          automatic_evaluation_snapshot?: Json
          comment?: string | null
          configuration_snapshot?: Json
          correction_request?: string | null
          correction_requested?: boolean
          created_at?: string
          generation_id?: string
          id?: string
          reasons?: string[]
          updated_at?: string
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_feedback_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_references: {
        Row: {
          created_at: string
          generation_id: string
          position: number
          upload_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generation_id: string
          position: number
          upload_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          generation_id?: string
          position?: number
          upload_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_references_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_references_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "user_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          asset_id: string | null
          brand_style_id: string | null
          client_request_id: string
          color_preference: string
          completed_at: string | null
          content_type: string
          cover_platform: string | null
          created_at: string
          credit_cost: number | null
          credit_reservation_id: string | null
          credit_transaction_id: string | null
          custom_colors: string[] | null
          enhanced_prompt: string | null
          error_code: string | null
          export_height: number | null
          export_width: number | null
          generation_metadata: Json
          height: number | null
          id: string
          mime_type: string | null
          model: string | null
          output_size: string | null
          platform: string | null
          preview_asset_id: string | null
          primary_text: string | null
          profile_mode: string | null
          project_id: string
          provider: string
          provider_height: number | null
          provider_request_id: string | null
          provider_width: number | null
          quality: string
          reference_asset_id: string | null
          requested_format: string
          requested_height: number | null
          requested_width: number | null
          size_fallback_reason: string | null
          size_fallback_used: boolean
          status: string
          storage_path: string | null
          style: string
          style_consistency: string | null
          user_id: string
          user_prompt: string
          variant: string | null
          width: number | null
        }
        Insert: {
          asset_id?: string | null
          brand_style_id?: string | null
          client_request_id: string
          color_preference: string
          completed_at?: string | null
          content_type: string
          cover_platform?: string | null
          created_at?: string
          credit_cost?: number | null
          credit_reservation_id?: string | null
          credit_transaction_id?: string | null
          custom_colors?: string[] | null
          enhanced_prompt?: string | null
          error_code?: string | null
          export_height?: number | null
          export_width?: number | null
          generation_metadata?: Json
          height?: number | null
          id?: string
          mime_type?: string | null
          model?: string | null
          output_size?: string | null
          platform?: string | null
          preview_asset_id?: string | null
          primary_text?: string | null
          profile_mode?: string | null
          project_id: string
          provider?: string
          provider_height?: number | null
          provider_request_id?: string | null
          provider_width?: number | null
          quality: string
          reference_asset_id?: string | null
          requested_format: string
          requested_height?: number | null
          requested_width?: number | null
          size_fallback_reason?: string | null
          size_fallback_used?: boolean
          status?: string
          storage_path?: string | null
          style: string
          style_consistency?: string | null
          user_id: string
          user_prompt: string
          variant?: string | null
          width?: number | null
        }
        Update: {
          asset_id?: string | null
          brand_style_id?: string | null
          client_request_id?: string
          color_preference?: string
          completed_at?: string | null
          content_type?: string
          cover_platform?: string | null
          created_at?: string
          credit_cost?: number | null
          credit_reservation_id?: string | null
          credit_transaction_id?: string | null
          custom_colors?: string[] | null
          enhanced_prompt?: string | null
          error_code?: string | null
          export_height?: number | null
          export_width?: number | null
          generation_metadata?: Json
          height?: number | null
          id?: string
          mime_type?: string | null
          model?: string | null
          output_size?: string | null
          platform?: string | null
          preview_asset_id?: string | null
          primary_text?: string | null
          profile_mode?: string | null
          project_id?: string
          provider?: string
          provider_height?: number | null
          provider_request_id?: string | null
          provider_width?: number | null
          quality?: string
          reference_asset_id?: string | null
          requested_format?: string
          requested_height?: number | null
          requested_width?: number | null
          size_fallback_reason?: string | null
          size_fallback_used?: boolean
          status?: string
          storage_path?: string | null
          style?: string
          style_consistency?: string | null
          user_id?: string
          user_prompt?: string
          variant?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_brand_style_id_fkey"
            columns: ["brand_style_id"]
            isOneToOne: false
            referencedRelation: "brand_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_credit_reservation_id_fkey"
            columns: ["credit_reservation_id"]
            isOneToOne: false
            referencedRelation: "credit_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_credit_transaction_id_fkey"
            columns: ["credit_transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_preview_asset_id_fkey"
            columns: ["preview_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_reference_asset_id_fkey"
            columns: ["reference_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      job_attempts: {
        Row: {
          attempt_no: number
          duration_ms: number | null
          error_code: string | null
          finished_at: string | null
          id: string
          job_id: string
          provider_request_id: string | null
          started_at: string
          status: string
          worker_id: string
        }
        Insert: {
          attempt_no: number
          duration_ms?: number | null
          error_code?: string | null
          finished_at?: string | null
          id?: string
          job_id: string
          provider_request_id?: string | null
          started_at?: string
          status: string
          worker_id: string
        }
        Update: {
          attempt_no?: number
          duration_ms?: number | null
          error_code?: string | null
          finished_at?: string | null
          id?: string
          job_id?: string
          provider_request_id?: string | null
          started_at?: string
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_attempts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_stage_spans: {
        Row: {
          attempt_no: number
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          generation_id: string
          id: string
          job_id: string
          metadata: Json
          stage: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_no: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          generation_id: string
          id?: string
          job_id: string
          metadata?: Json
          stage: string
          started_at: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_no?: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          generation_id?: string
          id?: string
          job_id?: string
          metadata?: Json
          stage?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_stage_spans_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_stage_spans_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_outbox: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          event_type: string
          id: string
          job_id: string
          last_error_code: string | null
          published_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          event_type?: string
          id?: string
          job_id: string
          last_error_code?: string | null
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string
          last_error_code?: string | null
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_outbox_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempt_count: number
          available_at: string
          cancelled_at: string | null
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          correlation_id: string
          created_at: string
          error_code: string | null
          estimated_cost_usd: number | null
          id: string
          idempotency_key: string
          input_hash: string
          job_type: string
          max_attempts: number
          output_bytes: number | null
          output_sha256: string | null
          payload: Json
          priority: number
          resource_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string | null
          visibility_expires_at: string | null
        }
        Insert: {
          attempt_count?: number
          available_at?: string
          cancelled_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          error_code?: string | null
          estimated_cost_usd?: number | null
          id?: string
          idempotency_key: string
          input_hash: string
          job_type: string
          max_attempts?: number
          output_bytes?: number | null
          output_sha256?: string | null
          payload?: Json
          priority?: number
          resource_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          visibility_expires_at?: string | null
        }
        Update: {
          attempt_count?: number
          available_at?: string
          cancelled_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          error_code?: string | null
          estimated_cost_usd?: number | null
          id?: string
          idempotency_key?: string
          input_hash?: string
          job_type?: string
          max_attempts?: number
          output_bytes?: number | null
          output_sha256?: string | null
          payload?: Json
          priority?: number
          resource_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          visibility_expires_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          asset_expiring: boolean
          billing_updates: boolean
          deliverability_blocked_at: string | null
          edit_ready: boolean
          generation_ready: boolean
          low_credits: boolean
          marketing_emails: boolean
          product_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_expiring?: boolean
          billing_updates?: boolean
          deliverability_blocked_at?: string | null
          edit_ready?: boolean
          generation_ready?: boolean
          low_credits?: boolean
          marketing_emails?: boolean
          product_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_expiring?: boolean
          billing_updates?: boolean
          deliverability_blocked_at?: string | null
          edit_ready?: boolean
          generation_ready?: boolean
          low_credits?: boolean
          marketing_emails?: boolean
          product_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      operational_metrics: {
        Row: {
          dimension: string
          metric_date: string
          metric_name: string
          metric_value: number
          updated_at: string
        }
        Insert: {
          dimension?: string
          metric_date?: string
          metric_name: string
          metric_value?: number
          updated_at?: string
        }
        Update: {
          dimension?: string
          metric_date?: string
          metric_name?: string
          metric_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      plan_overrides: {
        Row: {
          created_at: string
          expires_at: string | null
          plan_key: string
          reason: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          plan_key: string
          reason: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          plan_key?: string
          reason?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_feedback: {
        Row: {
          category: string
          consent_to_share_content: boolean
          created_at: string
          id: string
          message: string
          page_path: string | null
          related_reference_id: string | null
          related_reference_type: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          category: string
          consent_to_share_content?: boolean
          created_at?: string
          id?: string
          message: string
          page_path?: string | null
          related_reference_id?: string | null
          related_reference_type?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          consent_to_share_content?: boolean
          created_at?: string
          id?: string
          message?: string
          page_path?: string | null
          related_reference_id?: string | null
          related_reference_type?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          mfa_reminder_disabled: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          mfa_reminder_disabled?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mfa_reminder_disabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          content_type: string
          created_at: string
          id: string
          preview_asset_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          preview_asset_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          preview_asset_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_preview_asset_id_fkey"
            columns: ["preview_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_cost_events: {
        Row: {
          actual_cost_usd: number | null
          attempt_no: number
          cached_input_tokens: number
          cost_source: string
          created_at: string
          duration_ms: number
          error_code: string | null
          estimated_cost_usd: number | null
          generation_id: string
          id: string
          idempotency_key: string
          input_image_tokens: number
          input_text_tokens: number
          job_id: string
          metadata: Json
          model: string
          operation: string
          output_image_tokens: number
          output_text_tokens: number
          pricing_version: string
          provider: string
          provider_request_id: string | null
          succeeded: boolean
          total_tokens: number
          user_id: string
        }
        Insert: {
          actual_cost_usd?: number | null
          attempt_no: number
          cached_input_tokens?: number
          cost_source: string
          created_at?: string
          duration_ms: number
          error_code?: string | null
          estimated_cost_usd?: number | null
          generation_id: string
          id?: string
          idempotency_key: string
          input_image_tokens?: number
          input_text_tokens?: number
          job_id: string
          metadata?: Json
          model: string
          operation: string
          output_image_tokens?: number
          output_text_tokens?: number
          pricing_version: string
          provider: string
          provider_request_id?: string | null
          succeeded: boolean
          total_tokens?: number
          user_id: string
        }
        Update: {
          actual_cost_usd?: number | null
          attempt_no?: number
          cached_input_tokens?: number
          cost_source?: string
          created_at?: string
          duration_ms?: number
          error_code?: string | null
          estimated_cost_usd?: number | null
          generation_id?: string
          id?: string
          idempotency_key?: string
          input_image_tokens?: number
          input_text_tokens?: number
          job_id?: string
          metadata?: Json
          model?: string
          operation?: string
          output_image_tokens?: number
          output_text_tokens?: number
          pricing_version?: string
          provider?: string
          provider_request_id?: string | null
          succeeded?: boolean
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_cost_events_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_cost_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_usage: {
        Row: {
          created_at: string
          estimated_cost_usd: number | null
          id: string
          job_id: string
          model: string
          operation: string
          provider: string
          provider_request_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          job_id: string
          model: string
          operation: string
          provider: string
          provider_request_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          job_id?: string
          model?: string
          operation?: string
          provider?: string
          provider_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_counters: {
        Row: {
          action: string
          expires_at: string
          request_count: number
          scope_key: string
          window_started_at: string
        }
        Insert: {
          action: string
          expires_at: string
          request_count?: number
          scope_key: string
          window_started_at: string
        }
        Update: {
          action?: string
          expires_at?: string
          request_count?: number
          scope_key?: string
          window_started_at?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          api_version: string | null
          attempts: number
          created_at: string
          error_code: string | null
          event_type: string
          last_attempt_at: string
          livemode: boolean
          processed_at: string | null
          status: string
          stripe_event_id: string
        }
        Insert: {
          api_version?: string | null
          attempts?: number
          created_at?: string
          error_code?: string | null
          event_type: string
          last_attempt_at?: string
          livemode: boolean
          processed_at?: string | null
          status?: string
          stripe_event_id: string
        }
        Update: {
          api_version?: string | null
          attempts?: number
          created_at?: string
          error_code?: string | null
          event_type?: string
          last_attempt_at?: string
          livemode?: boolean
          processed_at?: string | null
          status?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          last_invoice_paid_at: string | null
          last_stripe_event_created_at: string | null
          livemode: boolean
          plan_key: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          last_invoice_paid_at?: string | null
          last_stripe_event_created_at?: string | null
          livemode: boolean
          plan_key: string
          status: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id: string
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          last_invoice_paid_at?: string | null
          last_stripe_event_created_at?: string | null
          livemode?: boolean
          plan_key?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          related_reference_id: string | null
          related_reference_type: string | null
          requester_email: string | null
          requester_email_hash: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          related_reference_id?: string | null
          related_reference_type?: string | null
          requester_email?: string | null
          requester_email_hash?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          related_reference_id?: string | null
          related_reference_type?: string | null
          requester_email?: string | null
          requester_email_hash?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tool_analysis_requests: {
        Row: {
          client_request_id: string
          completed_at: string | null
          created_at: string
          credit_transaction_id: string | null
          error_code: string | null
          id: string
          image_height: number
          image_mime_type: string
          image_width: number
          model: string
          result: Json | null
          status: string
          user_id: string
        }
        Insert: {
          client_request_id: string
          completed_at?: string | null
          created_at?: string
          credit_transaction_id?: string | null
          error_code?: string | null
          id?: string
          image_height: number
          image_mime_type: string
          image_width: number
          model: string
          result?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          client_request_id?: string
          completed_at?: string | null
          created_at?: string
          credit_transaction_id?: string | null
          error_code?: string | null
          id?: string
          image_height?: number
          image_mime_type?: string
          image_width?: number
          model?: string
          result?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_analysis_requests_credit_transaction_id_fkey"
            columns: ["credit_transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          id: string
          policy_version: string
          source: string
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted: boolean
          id?: string
          policy_version: string
          source: string
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: string
          policy_version?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          onboarding_completed_at: string | null
          primary_use_cases: string[]
          updated_at: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          created_at?: string
          onboarding_completed_at?: string | null
          primary_use_cases?: string[]
          updated_at?: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          created_at?: string
          onboarding_completed_at?: string | null
          primary_use_cases?: string[]
          updated_at?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      user_activity_days: {
        Row: {
          activity_date: string
          first_seen_at: string
          last_seen_at: string
          user_id: string
        }
        Insert: {
          activity_date: string
          first_seen_at?: string
          last_seen_at?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          first_seen_at?: string
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_uploads: {
        Row: {
          asset_id: string | null
          created_at: string
          expires_at: string | null
          file_size: number
          height: number
          id: string
          mime_type: string
          original_filename: string
          purpose: string
          storage_path: string
          user_id: string
          width: number
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          expires_at?: string | null
          file_size: number
          height: number
          id?: string
          mime_type: string
          original_filename: string
          purpose?: string
          storage_path: string
          user_id: string
          width: number
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          expires_at?: string | null
          file_size?: number
          height?: number
          id?: string
          mime_type?: string
          original_filename?: string
          purpose?: string
          storage_path?: string
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_uploads_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activation_analytics_internal: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      fail_open_job_stages_internal: {
        Args: { p_attempt_no: number; p_error_code: string; p_job_id: string }
        Returns: number
      }
      finish_job_stage_internal: {
        Args: {
          p_attempt_no: number
          p_job_id: string
          p_metadata?: Json
          p_stage: string
          p_status: string
        }
        Returns: undefined
      }
      product_analytics_internal: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      record_generation_abandonments_internal: {
        Args: { p_after_hours?: number; p_limit?: number }
        Returns: number
      }
      record_generation_event_internal: {
        Args: {
          p_duration_ms?: number | null
          p_event_type: string
          p_generation_id: string
          p_idempotency_key: string
          p_job_id: string | null
          p_properties?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      queue_stage_analytics_internal: {
        Args: { p_from?: string; p_stuck_minutes?: number; p_to?: string }
        Returns: Json
      }
      record_activation_event_internal: {
        Args: {
          p_event_type: string
          p_idempotency_key: string
          p_properties?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      record_user_activity_internal: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      record_provider_cost_internal: {
        Args: {
          p_actual_cost_usd: number | null
          p_attempt_no: number
          p_cached_input_tokens: number
          p_cost_source: string
          p_duration_ms: number
          p_error_code: string | null
          p_estimated_cost_usd: number | null
          p_generation_id: string
          p_idempotency_key: string
          p_input_image_tokens: number
          p_input_text_tokens: number
          p_job_id: string
          p_metadata?: Json
          p_model: string
          p_operation: string
          p_output_image_tokens: number
          p_output_text_tokens: number
          p_pricing_version: string
          p_provider: string
          p_provider_request_id: string | null
          p_succeeded: boolean
          p_total_tokens: number
          p_user_id: string
        }
        Returns: undefined
      }
      start_job_stage_internal: {
        Args: {
          p_attempt_no: number
          p_generation_id: string
          p_job_id: string
          p_metadata?: Json
          p_stage: string
          p_started_at: string
          p_user_id: string
        }
        Returns: undefined
      }
      archive_edit_session: {
        Args: { p_archived: boolean; p_session_id: string }
        Returns: undefined
      }
      assert_operational_budget_internal: {
        Args: {
          p_daily_budget_usd: number
          p_estimated_cost_usd: number
          p_monthly_budget_usd: number
        }
        Returns: undefined
      }
      attach_generation_references: {
        Args: { p_generation_id: string; p_upload_ids: string[] }
        Returns: undefined
      }
      cancel_job_internal: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: boolean
      }
      claim_beta_invite_internal: {
        Args: { p_code_hash: string; p_email: string }
        Returns: boolean
      }
      claim_job_internal: {
        Args: {
          p_global_concurrency: number
          p_job_id: string
          p_user_concurrency: number
          p_visibility_seconds: number
          p_worker_id: string
        }
        Returns: {
          attempt_count: number
          available_at: string
          cancelled_at: string | null
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          correlation_id: string
          created_at: string
          error_code: string | null
          estimated_cost_usd: number | null
          id: string
          idempotency_key: string
          input_hash: string
          job_type: string
          max_attempts: number
          output_bytes: number | null
          output_sha256: string | null
          payload: Json
          priority: number
          resource_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string | null
          visibility_expires_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_stripe_event_internal: {
        Args: {
          p_api_version: string | null
          p_event_id: string
          p_event_type: string
          p_livemode: boolean
        }
        Returns: string
      }
      complete_edit_job_internal: {
        Args: {
          p_duration_ms: number
          p_height: number
          p_job_id: string
          p_mime_type: string
          p_model: string
          p_provider_response_id: string | null
          p_reservation_id: string
          p_storage_path: string
          p_user_id: string
          p_version_id: string
          p_width: number
        }
        Returns: {
          credits_remaining: number
          credits_used: number
        }[]
      }
      complete_edit_version: {
        Args: {
          p_height: number
          p_mime_type: string
          p_model: string
          p_provider_response_id: string
          p_storage_path: string
          p_version_id: string
          p_width: number
        }
        Returns: undefined
      }
      complete_edit_version_with_credits_internal: {
        Args: {
          p_height: number
          p_mime_type: string
          p_model: string
          p_provider_response_id: string
          p_reservation_id: string
          p_storage_path: string
          p_user_id: string
          p_version_id: string
          p_width: number
        }
        Returns: {
          credit_transaction_id: string
          credits_remaining: number
          credits_used: number
        }[]
      }
      complete_generation_job_internal: {
        Args: {
          p_duration_ms: number
          p_generation_id: string
          p_height: number
          p_job_id: string
          p_mime_type: string
          p_model: string
          p_provider_request_id: string | null
          p_reservation_id: string
          p_storage_path: string
          p_user_id: string
          p_width: number
        }
        Returns: {
          credits_remaining: number
          credits_used: number
        }[]
      }
      complete_generation_with_credits_internal: {
        Args: {
          p_generation_id: string
          p_height: number
          p_mime_type: string
          p_model: string
          p_provider_request_id: string | null
          p_reservation_id: string
          p_storage_path: string
          p_user_id: string
          p_width: number
        }
        Returns: {
          credit_transaction_id: string
          credits_remaining: number
          credits_used: number
        }[]
      }
      consume_rate_limit_internal: {
        Args: {
          p_action: string
          p_limit: number
          p_scope_key: string
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          retry_after_seconds: number
        }[]
      }
      consume_reserved_credits_internal: {
        Args: {
          p_description: string
          p_reference_id: string
          p_reference_type: string
          p_reservation_id: string
          p_user_id: string
        }
        Returns: {
          consumed_amount: number
          credits_remaining: number
          transaction_id: string
        }[]
      }
      create_edit_job_internal: {
        Args: {
          p_base_version_id: string | null
          p_client_request_id: string
          p_cooldown_seconds: number
          p_credit_cost: number
          p_daily_budget_usd: number | null
          p_daily_limit: number
          p_enhanced_instruction: string
          p_estimated_cost_usd: number | null
          p_input_hash: string
          p_instruction: string
          p_monthly_budget_usd: number | null
          p_preserve_composition: boolean
          p_session_id: string
          p_user_id: string
          p_version_limit: number
        }
        Returns: {
          is_existing: boolean
          job_id: string
          job_status: string
          selected_base_version_id: string
          version_id: string
          version_status: string
        }[]
      }
      create_edit_session_from_generation: {
        Args: { p_generation_id: string }
        Returns: {
          created_session_id: string
          created_version_id: string
        }[]
      }
      create_edit_session_from_upload: {
        Args: { p_title: string; p_upload_id: string }
        Returns: {
          created_session_id: string
          created_version_id: string
        }[]
      }
      create_generation_job_internal: {
        Args: {
          p_client_request_id: string
          p_color_preference: string
          p_content_type: string
          p_cooldown_seconds: number
          p_credit_cost: number
          p_custom_colors: string[] | null
          p_daily_budget_usd: number | null
          p_daily_limit: number
          p_estimated_cost_usd: number | null
          p_input_hash: string
          p_monthly_budget_usd: number | null
          p_primary_text: string | null
          p_project_id: string | null
          p_quality: string
          p_reference_upload_ids: string[]
          p_requested_format: string
          p_style: string
          p_title: string
          p_user_id: string
          p_user_prompt: string
        }
        Returns: {
          generation_id: string
          generation_status: string
          is_existing: boolean
          job_id: string
          job_status: string
          project_id: string
        }[]
      }
      enqueue_transactional_email_internal: {
        Args: {
          p_audience: string
          p_data: Json
          p_delivery_id: string
          p_email_type: string
          p_idempotency_key: string
          p_input_hash: string
          p_job_id: string
          p_user_id: string | null
        }
        Returns: string
      }
      expire_credits_internal: { Args: { p_user_id: string }; Returns: number }
      fail_edit_version: {
        Args: { p_error_code: string; p_version_id: string }
        Returns: undefined
      }
      fail_job_internal: {
        Args: { p_duration_ms: number; p_error_code: string; p_job_id: string }
        Returns: boolean
      }
      finish_stripe_event_internal: {
        Args: { p_error_code: string | null; p_event_id: string; p_status: string }
        Returns: undefined
      }
      get_storage_usage_internal: {
        Args: { p_user_id: string }
        Returns: {
          active_count: number
          expiring_soon_count: number
          pinned_bytes: number
          pinned_count: number
          temporary_count: number
          used_bytes: number
        }[]
      }
      grant_credits_internal: {
        Args: {
          p_amount: number
          p_description: string
          p_expires_at: string | null
          p_source_reference: string
          p_source_type: string
          p_user_id: string
        }
        Returns: string
      }
      grant_subscription_credits_internal: {
        Args: {
          p_amount: number
          p_expires_at: string | null
          p_invoice_id: string
          p_plan_key: string
          p_user_id: string
        }
        Returns: string
      }
      increment_operational_metric_internal: {
        Args: {
          p_dimension: string
          p_increment?: number
          p_metric_name: string
        }
        Returns: undefined
      }
      list_expired_uploads_internal: {
        Args: { p_limit?: number }
        Returns: {
          storage_path: string
          upload_id: string
        }[]
      }
      mark_job_processing_internal: {
        Args: { p_job_id: string; p_worker_id: string }
        Returns: boolean
      }
      mark_job_ready_internal: {
        Args: { p_job_id: string; p_max_attempts: number; p_user_id: string }
        Returns: boolean
      }
      publish_job_outbox_internal: {
        Args: { p_limit: number }
        Returns: number
      }
      record_signup_consents_internal: {
        Args: {
          p_marketing_opt_in: boolean
          p_privacy_version: string
          p_source: string
          p_terms_version: string
          p_user_id: string
        }
        Returns: undefined
      }
      recover_stuck_jobs_internal: {
        Args: { p_limit: number }
        Returns: number
      }
      release_reserved_credits_internal: {
        Args: { p_reservation_id: string; p_user_id: string }
        Returns: number
      }
      reserve_credits_internal: {
        Args: {
          p_amount: number
          p_idempotency_key: string
          p_reference_id: string
          p_reference_type: string
          p_user_id: string
        }
        Returns: {
          credits_remaining: number
          is_existing: boolean
          reservation_id: string
          reserved_amount: number
        }[]
      }
      reserve_edit_version: {
        Args: {
          p_base_version_id: string
          p_client_request_id: string
          p_cooldown_seconds: number
          p_daily_limit: number
          p_enhanced_instruction: string
          p_instruction: string
          p_preserve_composition: boolean
          p_session_id: string
          p_version_limit: number
        }
        Returns: {
          is_existing: boolean
          reserved_version_id: string
          selected_base_version_id: string
          version_status: string
        }[]
      }
      reserve_generation: {
        Args: {
          p_client_request_id: string
          p_color_preference: string
          p_content_type: string
          p_cooldown_seconds: number
          p_custom_colors: string[]
          p_daily_limit: number
          p_primary_text: string
          p_project_id: string
          p_quality: string
          p_requested_format: string
          p_style: string
          p_title: string
          p_user_prompt: string
        }
        Returns: {
          generation_status: string
          is_existing: boolean
          reserved_generation_id: string
          reserved_project_id: string
        }[]
      }
      restore_edit_version: {
        Args: { p_session_id: string; p_version_id: string }
        Returns: undefined
      }
      retry_job_internal: {
        Args: {
          p_delay_seconds: number
          p_duration_ms: number
          p_error_code: string
          p_job_id: string
        }
        Returns: string
      }
      sync_credit_settings_internal: {
        Args: {
          p_business_monthly_credits: number
          p_free_signup_credits: number
          p_pro_monthly_credits: number
        }
        Returns: undefined
      }
      update_notification_preferences: {
        Args: {
          p_asset_expiring: boolean
          p_edit_ready: boolean
          p_generation_ready: boolean
          p_low_credits: boolean
          p_marketing_emails: boolean
          p_product_updates: boolean
        }
        Returns: {
          asset_expiring: boolean
          billing_updates: boolean
          deliverability_blocked_at: string | null
          edit_ready: boolean
          generation_ready: boolean
          low_credits: boolean
          marketing_emails: boolean
          product_updates: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_beta_invite_internal: {
        Args: { p_code_hash: string; p_email: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
