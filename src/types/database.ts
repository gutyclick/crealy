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
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
