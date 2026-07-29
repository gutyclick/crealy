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
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content_type: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      generations: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          client_request_id: string;
          status: string;
          user_prompt: string;
          enhanced_prompt: string | null;
          content_type: string;
          requested_format: string;
          output_size: string | null;
          style: string;
          quality: string;
          primary_text: string | null;
          color_preference: string;
          custom_colors: string[] | null;
          storage_path: string | null;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          provider: string;
          model: string | null;
          provider_request_id: string | null;
          error_code: string | null;
          credit_reservation_id: string | null;
          credit_transaction_id: string | null;
          credit_cost: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          client_request_id: string;
          status?: string;
          user_prompt: string;
          enhanced_prompt?: string | null;
          content_type: string;
          requested_format: string;
          output_size?: string | null;
          style: string;
          quality: string;
          primary_text?: string | null;
          color_preference: string;
          custom_colors?: string[] | null;
          storage_path?: string | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          provider?: string;
          model?: string | null;
          provider_request_id?: string | null;
          error_code?: string | null;
          credit_reservation_id?: string | null;
          credit_transaction_id?: string | null;
          credit_cost?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          client_request_id?: string;
          status?: string;
          user_prompt?: string;
          enhanced_prompt?: string | null;
          content_type?: string;
          requested_format?: string;
          output_size?: string | null;
          style?: string;
          quality?: string;
          primary_text?: string | null;
          color_preference?: string;
          custom_colors?: string[] | null;
          storage_path?: string | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          provider?: string;
          model?: string | null;
          provider_request_id?: string | null;
          error_code?: string | null;
          credit_reservation_id?: string | null;
          credit_transaction_id?: string | null;
          credit_cost?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "generations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      user_uploads: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          file_size: number;
          width: number;
          height: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          file_size: number;
          width: number;
          height: number;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          original_filename?: string;
        };
        Relationships: [];
      };
      edit_sessions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          source_generation_id: string | null;
          source_upload_id: string | null;
          title: string;
          status: string;
          current_version_id: string | null;
          previous_response_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          source_generation_id?: string | null;
          source_upload_id?: string | null;
          title: string;
          status?: string;
          current_version_id?: string | null;
          previous_response_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          status?: string;
          current_version_id?: string | null;
          previous_response_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      edit_versions: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          client_request_id: string | null;
          parent_version_id: string | null;
          source_generation_id: string | null;
          source_upload_id: string | null;
          status: string;
          storage_path: string | null;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          instruction: string | null;
          enhanced_instruction: string | null;
          preserve_composition: boolean;
          model: string | null;
          provider_response_id: string | null;
          error_code: string | null;
          credit_reservation_id: string | null;
          credit_transaction_id: string | null;
          credit_cost: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          client_request_id?: string | null;
          parent_version_id?: string | null;
          source_generation_id?: string | null;
          source_upload_id?: string | null;
          status?: string;
          storage_path?: string | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          instruction?: string | null;
          enhanced_instruction?: string | null;
          preserve_composition?: boolean;
          model?: string | null;
          provider_response_id?: string | null;
          error_code?: string | null;
          credit_reservation_id?: string | null;
          credit_transaction_id?: string | null;
          credit_cost?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: string;
          storage_path?: string | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          enhanced_instruction?: string | null;
          model?: string | null;
          provider_response_id?: string | null;
          error_code?: string | null;
          credit_reservation_id?: string | null;
          credit_transaction_id?: string | null;
          credit_cost?: number | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      edit_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          version_id: string | null;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          version_id?: string | null;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      generation_references: {
        Row: {
          generation_id: string;
          upload_id: string;
          user_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          generation_id: string;
          upload_id: string;
          user_id: string;
          position: number;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      billing_settings: {
        Row: {
          id: boolean;
          free_signup_credits: number;
          pro_monthly_credits: number;
          business_monthly_credits: number;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          free_signup_credits?: number;
          pro_monthly_credits?: number;
          business_monthly_credits?: number;
          updated_at?: string;
        };
        Update: {
          free_signup_credits?: number;
          pro_monthly_credits?: number;
          business_monthly_credits?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_customers: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          livemode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          livemode: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_customer_id?: string;
          livemode?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          plan_key: string;
          status: string;
          currency: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          ended_at: string | null;
          trial_end: string | null;
          last_stripe_event_created_at: string | null;
          last_invoice_paid_at: string | null;
          livemode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          plan_key: string;
          status: string;
          currency?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          ended_at?: string | null;
          trial_end?: string | null;
          last_stripe_event_created_at?: string | null;
          last_invoice_paid_at?: string | null;
          livemode: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_customer_id?: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          plan_key?: string;
          status?: string;
          currency?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          ended_at?: string | null;
          trial_end?: string | null;
          last_stripe_event_created_at?: string | null;
          last_invoice_paid_at?: string | null;
          livemode?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_accounts: {
        Row: {
          user_id: string;
          available_balance: number;
          reserved_balance: number;
          lifetime_granted: number;
          lifetime_consumed: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          available_balance?: number;
          reserved_balance?: number;
          lifetime_granted?: number;
          lifetime_consumed?: number;
          updated_at?: string;
        };
        Update: {
          available_balance?: number;
          reserved_balance?: number;
          lifetime_granted?: number;
          lifetime_consumed?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_grants: {
        Row: {
          id: string;
          user_id: string;
          source_type: string;
          source_reference: string | null;
          initial_amount: number;
          remaining_amount: number;
          reserved_amount: number;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: string;
          source_reference?: string | null;
          initial_amount: number;
          remaining_amount: number;
          reserved_amount?: number;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          remaining_amount?: number;
          reserved_amount?: number;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      credit_reservations: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          status: string;
          reference_type: string;
          reference_id: string;
          idempotency_key: string;
          created_at: string;
          finalized_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          status?: string;
          reference_type: string;
          reference_id: string;
          idempotency_key: string;
          created_at?: string;
          finalized_at?: string | null;
        };
        Update: {
          status?: string;
          finalized_at?: string | null;
        };
        Relationships: [];
      };
      credit_reservation_items: {
        Row: {
          reservation_id: string;
          grant_id: string;
          amount: number;
        };
        Insert: {
          reservation_id: string;
          grant_id: string;
          amount: number;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          grant_id: string | null;
          reservation_id: string | null;
          transaction_type: string;
          amount: number;
          balance_after: number | null;
          reference_type: string | null;
          reference_id: string | null;
          idempotency_key: string | null;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          grant_id?: string | null;
          reservation_id?: string | null;
          transaction_type: string;
          amount: number;
          balance_after?: number | null;
          reference_type?: string | null;
          reference_id?: string | null;
          idempotency_key?: string | null;
          description: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      stripe_events: {
        Row: {
          stripe_event_id: string;
          event_type: string;
          api_version: string | null;
          livemode: boolean;
          status: string;
          attempts: number;
          last_attempt_at: string;
          processed_at: string | null;
          error_code: string | null;
          created_at: string;
        };
        Insert: {
          stripe_event_id: string;
          event_type: string;
          api_version?: string | null;
          livemode: boolean;
          status?: string;
          attempts?: number;
          last_attempt_at?: string;
          processed_at?: string | null;
          error_code?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          attempts?: number;
          last_attempt_at?: string;
          processed_at?: string | null;
          error_code?: string | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          job_type: string;
          status: string;
          idempotency_key: string;
          correlation_id: string;
          resource_id: string;
          payload: Json;
          input_hash: string;
          output_sha256: string | null;
          output_bytes: number | null;
          priority: number;
          attempt_count: number;
          max_attempts: number;
          available_at: string;
          claimed_at: string | null;
          claimed_by: string | null;
          visibility_expires_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          error_code: string | null;
          estimated_cost_usd: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_type: string;
          status?: string;
          idempotency_key: string;
          correlation_id?: string;
          resource_id: string;
          payload?: Json;
          input_hash: string;
          output_sha256?: string | null;
          output_bytes?: number | null;
          priority?: number;
          attempt_count?: number;
          max_attempts?: number;
          available_at?: string;
          claimed_at?: string | null;
          claimed_by?: string | null;
          visibility_expires_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          error_code?: string | null;
          estimated_cost_usd?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
        Relationships: [];
      };
      job_attempts: {
        Row: {
          id: string;
          job_id: string;
          attempt_no: number;
          worker_id: string;
          status: string;
          provider_request_id: string | null;
          error_code: string | null;
          duration_ms: number | null;
          started_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          attempt_no: number;
          worker_id: string;
          status: string;
          provider_request_id?: string | null;
          error_code?: string | null;
          duration_ms?: number | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["job_attempts"]["Insert"]>;
        Relationships: [];
      };
      job_outbox: {
        Row: {
          id: string;
          job_id: string;
          event_type: string;
          status: string;
          attempts: number;
          available_at: string;
          published_at: string | null;
          last_error_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          event_type?: string;
          status?: string;
          attempts?: number;
          available_at?: string;
          published_at?: string | null;
          last_error_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_outbox"]["Insert"]>;
        Relationships: [];
      };
      provider_usage: {
        Row: {
          id: string;
          job_id: string;
          user_id: string;
          provider: string;
          model: string;
          operation: string;
          provider_request_id: string | null;
          estimated_cost_usd: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          user_id: string;
          provider: string;
          model: string;
          operation: string;
          provider_request_id?: string | null;
          estimated_cost_usd?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["provider_usage"]["Insert"]>;
        Relationships: [];
      };
      operational_metrics: {
        Row: {
          metric_date: string;
          metric_name: string;
          dimension: string;
          metric_value: number;
          updated_at: string;
        };
        Insert: {
          metric_date?: string;
          metric_name: string;
          dimension?: string;
          metric_value?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["operational_metrics"]["Insert"]>;
        Relationships: [];
      };
      rate_limit_counters: {
        Row: {
          scope_key: string;
          action: string;
          window_started_at: string;
          request_count: number;
          expires_at: string;
        };
        Insert: {
          scope_key: string;
          action: string;
          window_started_at: string;
          request_count?: number;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limit_counters"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      reserve_generation: {
        Args: {
          p_client_request_id: string;
          p_project_id: string | null;
          p_title: string;
          p_user_prompt: string;
          p_content_type: string;
          p_requested_format: string;
          p_style: string;
          p_quality: string;
          p_primary_text: string | null;
          p_color_preference: string;
          p_custom_colors: string[] | null;
          p_daily_limit: number;
          p_cooldown_seconds: number;
        };
        Returns: {
          reserved_generation_id: string;
          reserved_project_id: string;
          generation_status: string;
          is_existing: boolean;
        }[];
      };
      create_edit_session_from_generation: {
        Args: { p_generation_id: string };
        Returns: {
          created_session_id: string;
          created_version_id: string;
        }[];
      };
      create_edit_session_from_upload: {
        Args: { p_upload_id: string; p_title: string };
        Returns: {
          created_session_id: string;
          created_version_id: string;
        }[];
      };
      reserve_edit_version: {
        Args: {
          p_session_id: string;
          p_client_request_id: string;
          p_base_version_id: string | null;
          p_instruction: string;
          p_enhanced_instruction: string;
          p_preserve_composition: boolean;
          p_daily_limit: number;
          p_cooldown_seconds: number;
          p_version_limit: number;
        };
        Returns: {
          reserved_version_id: string;
          selected_base_version_id: string;
          version_status: string;
          is_existing: boolean;
        }[];
      };
      complete_edit_version: {
        Args: {
          p_version_id: string;
          p_storage_path: string;
          p_mime_type: string;
          p_width: number;
          p_height: number;
          p_model: string;
          p_provider_response_id: string;
        };
        Returns: undefined;
      };
      fail_edit_version: {
        Args: { p_version_id: string; p_error_code: string };
        Returns: undefined;
      };
      restore_edit_version: {
        Args: { p_session_id: string; p_version_id: string };
        Returns: undefined;
      };
      archive_edit_session: {
        Args: { p_session_id: string; p_archived: boolean };
        Returns: undefined;
      };
      attach_generation_references: {
        Args: {
          p_generation_id: string;
          p_upload_ids: string[];
        };
        Returns: undefined;
      };
      sync_credit_settings_internal: {
        Args: {
          p_free_signup_credits: number;
          p_pro_monthly_credits: number;
          p_business_monthly_credits: number;
        };
        Returns: undefined;
      };
      grant_credits_internal: {
        Args: {
          p_user_id: string;
          p_source_type: string;
          p_source_reference: string | null;
          p_amount: number;
          p_expires_at: string | null;
          p_description: string;
        };
        Returns: string;
      };
      expire_credits_internal: {
        Args: { p_user_id: string };
        Returns: number;
      };
      reserve_credits_internal: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_reference_type: string;
          p_reference_id: string;
          p_idempotency_key: string;
        };
        Returns: {
          reservation_id: string;
          reserved_amount: number;
          credits_remaining: number;
          is_existing: boolean;
        }[];
      };
      consume_reserved_credits_internal: {
        Args: {
          p_user_id: string;
          p_reservation_id: string;
          p_reference_type: string;
          p_reference_id: string;
          p_description: string;
        };
        Returns: {
          transaction_id: string;
          consumed_amount: number;
          credits_remaining: number;
        }[];
      };
      release_reserved_credits_internal: {
        Args: {
          p_user_id: string;
          p_reservation_id: string;
        };
        Returns: number;
      };
      grant_subscription_credits_internal: {
        Args: {
          p_user_id: string;
          p_invoice_id: string;
          p_amount: number;
          p_expires_at: string | null;
          p_plan_key: string;
        };
        Returns: string;
      };
      claim_stripe_event_internal: {
        Args: {
          p_event_id: string;
          p_event_type: string;
          p_api_version: string | null;
          p_livemode: boolean;
        };
        Returns: string;
      };
      finish_stripe_event_internal: {
        Args: {
          p_event_id: string;
          p_status: string;
          p_error_code: string | null;
        };
        Returns: undefined;
      };
      complete_generation_with_credits_internal: {
        Args: {
          p_user_id: string;
          p_generation_id: string;
          p_reservation_id: string;
          p_storage_path: string;
          p_mime_type: string;
          p_width: number;
          p_height: number;
          p_model: string;
          p_provider_request_id: string | null;
        };
        Returns: {
          credit_transaction_id: string;
          credits_used: number;
          credits_remaining: number;
        }[];
      };
      complete_edit_version_with_credits_internal: {
        Args: {
          p_user_id: string;
          p_version_id: string;
          p_reservation_id: string;
          p_storage_path: string;
          p_mime_type: string;
          p_width: number;
          p_height: number;
          p_model: string;
          p_provider_response_id: string;
        };
        Returns: {
          credit_transaction_id: string;
          credits_used: number;
          credits_remaining: number;
        }[];
      };
      consume_rate_limit_internal: {
        Args: {
          p_scope_key: string;
          p_action: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
          retry_after_seconds: number;
        }[];
      };
      increment_operational_metric_internal: {
        Args: {
          p_metric_name: string;
          p_dimension: string;
          p_increment?: number;
        };
        Returns: undefined;
      };
      assert_operational_budget_internal: {
        Args: {
          p_estimated_cost_usd: number | null;
          p_daily_budget_usd: number | null;
          p_monthly_budget_usd: number | null;
        };
        Returns: undefined;
      };
      create_generation_job_internal: {
        Args: {
          p_user_id: string;
          p_client_request_id: string;
          p_project_id: string | null;
          p_title: string;
          p_user_prompt: string;
          p_content_type: string;
          p_requested_format: string;
          p_style: string;
          p_quality: string;
          p_primary_text: string | null;
          p_color_preference: string;
          p_custom_colors: string[] | null;
          p_reference_upload_ids: string[];
          p_input_hash: string;
          p_credit_cost: number;
          p_daily_limit: number;
          p_cooldown_seconds: number;
          p_estimated_cost_usd: number | null;
          p_daily_budget_usd: number | null;
          p_monthly_budget_usd: number | null;
        };
        Returns: {
          job_id: string;
          generation_id: string;
          project_id: string;
          job_status: string;
          generation_status: string;
          is_existing: boolean;
        }[];
      };
      create_edit_job_internal: {
        Args: {
          p_user_id: string;
          p_session_id: string;
          p_client_request_id: string;
          p_base_version_id: string | null;
          p_instruction: string;
          p_enhanced_instruction: string;
          p_preserve_composition: boolean;
          p_input_hash: string;
          p_credit_cost: number;
          p_daily_limit: number;
          p_cooldown_seconds: number;
          p_version_limit: number;
          p_estimated_cost_usd: number | null;
          p_daily_budget_usd: number | null;
          p_monthly_budget_usd: number | null;
        };
        Returns: {
          job_id: string;
          version_id: string;
          selected_base_version_id: string;
          job_status: string;
          version_status: string;
          is_existing: boolean;
        }[];
      };
      publish_job_outbox_internal: {
        Args: { p_limit: number };
        Returns: number;
      };
      claim_job_internal: {
        Args: {
          p_job_id: string;
          p_worker_id: string;
          p_visibility_seconds: number;
          p_global_concurrency: number;
          p_user_concurrency: number;
        };
        Returns: Database["public"]["Tables"]["jobs"]["Row"][];
      };
      mark_job_processing_internal: {
        Args: { p_job_id: string; p_worker_id: string };
        Returns: boolean;
      };
      complete_generation_job_internal: {
        Args: {
          p_job_id: string;
          p_user_id: string;
          p_generation_id: string;
          p_reservation_id: string;
          p_storage_path: string;
          p_mime_type: string;
          p_width: number;
          p_height: number;
          p_model: string;
          p_provider_request_id: string | null;
          p_duration_ms: number;
        };
        Returns: { credits_used: number; credits_remaining: number }[];
      };
      complete_edit_job_internal: {
        Args: {
          p_job_id: string;
          p_user_id: string;
          p_version_id: string;
          p_reservation_id: string;
          p_storage_path: string;
          p_mime_type: string;
          p_width: number;
          p_height: number;
          p_model: string;
          p_provider_response_id: string | null;
          p_duration_ms: number;
        };
        Returns: { credits_used: number; credits_remaining: number }[];
      };
      retry_job_internal: {
        Args: {
          p_job_id: string;
          p_error_code: string;
          p_delay_seconds: number;
          p_duration_ms: number;
        };
        Returns: string;
      };
      fail_job_internal: {
        Args: {
          p_job_id: string;
          p_error_code: string;
          p_duration_ms: number;
        };
        Returns: boolean;
      };
      cancel_job_internal: {
        Args: { p_job_id: string; p_user_id: string };
        Returns: boolean;
      };
      recover_stuck_jobs_internal: {
        Args: { p_limit: number };
        Returns: number;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
