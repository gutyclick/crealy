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
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
