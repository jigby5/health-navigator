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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_chats: {
        Row: {
          chat_content: string | null
          chat_id: number
          time_chat_started: string
          user_id: number | null
        }
        Insert: {
          chat_content?: string | null
          chat_id?: number
          time_chat_started?: string
          user_id?: number | null
        }
        Update: {
          chat_content?: string | null
          chat_id?: number
          time_chat_started?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      appointments: {
        Row: {
          appt_id: number
          date_time: string
          doctor_id: number | null
          status: string
          user_id: number | null
          user_notes: string | null
        }
        Insert: {
          appt_id?: number
          date_time: string
          doctor_id?: number | null
          status?: string
          user_id?: number | null
          user_notes?: string | null
        }
        Update: {
          appt_id?: number
          date_time?: string
          doctor_id?: number | null
          status?: string
          user_id?: number | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "healthcare_providers"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      articles: {
        Row: {
          article_id: number
          category: string
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          article_id?: number
          category: string
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          article_id?: number
          category?: string
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      healthcare_providers: {
        Row: {
          doctor_id: number
          facility_name: string
          full_name: string
          specialty: string
        }
        Insert: {
          doctor_id?: number
          facility_name: string
          full_name: string
          specialty: string
        }
        Update: {
          doctor_id?: number
          facility_name?: string
          full_name?: string
          specialty?: string
        }
        Relationships: []
      }
      provider_schedule_blocks: {
        Row: {
          block_id: number
          doctor_id: number
          end_at: string
          is_full_day: boolean
          reason: string | null
          start_at: string
        }
        Insert: {
          block_id?: number
          doctor_id: number
          end_at: string
          is_full_day?: boolean
          reason?: string | null
          start_at: string
        }
        Update: {
          block_id?: number
          doctor_id?: number
          end_at?: string
          is_full_day?: boolean
          reason?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_schedule_blocks_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "healthcare_providers"
            referencedColumns: ["doctor_id"]
          },
        ]
      }
      insurance_plan_catalog: {
        Row: {
          annual_deductible: number
          catalog_plan_id: number
          copay_amount: number
          out_of_pocket_max: number
          plan_name: string
          policy_type: string
          provider_id: number
        }
        Insert: {
          annual_deductible?: number
          catalog_plan_id?: number
          copay_amount?: number
          out_of_pocket_max?: number
          plan_name: string
          policy_type: string
          provider_id: number
        }
        Update: {
          annual_deductible?: number
          catalog_plan_id?: number
          copay_amount?: number
          out_of_pocket_max?: number
          plan_name?: string
          policy_type?: string
          provider_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "insurance_plan_catalog_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      insurance_plans: {
        Row: {
          catalog_plan_id: number
          plan_id: number
          remaining_balance: number | null
          user_id: number
        }
        Insert: {
          catalog_plan_id: number
          plan_id?: number
          remaining_balance?: number | null
          user_id: number
        }
        Update: {
          catalog_plan_id?: number
          plan_id?: number
          remaining_balance?: number | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "insurance_plans_catalog_plan_id_fkey"
            columns: ["catalog_plan_id"]
            isOneToOne: false
            referencedRelation: "insurance_plan_catalog"
            referencedColumns: ["catalog_plan_id"]
          },
          {
            foreignKeyName: "insurance_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          name: string
          network_type: string
          provider_id: number
        }
        Insert: {
          name: string
          network_type: string
          provider_id?: number
        }
        Update: {
          name?: string
          network_type?: string
          provider_id?: number
        }
        Relationships: []
      }
      provider_network: {
        Row: {
          healthcare_provider_id: number
          insurance_provider_id: number
        }
        Insert: {
          healthcare_provider_id: number
          insurance_provider_id: number
        }
        Update: {
          healthcare_provider_id?: number
          insurance_provider_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_network_healthcare_provider_id_fkey"
            columns: ["healthcare_provider_id"]
            isOneToOne: false
            referencedRelation: "healthcare_providers"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "provider_network_insurance_provider_id_fkey"
            columns: ["insurance_provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      user_articles: {
        Row: {
          article_id: number
          user_id: number
        }
        Insert: {
          article_id: number
          user_id: number
        }
        Update: {
          article_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "user_articles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          first_name: string
          health_profile: string | null
          last_name: string
          password_hash: string
          role: Database["public"]["Enums"]["user_role"]
          total_balance_due: number | null
          total_copay_amounts: number | null
          user_id: number
        }
        Insert: {
          email: string
          first_name: string
          health_profile?: string | null
          last_name: string
          password_hash: string
          role?: Database["public"]["Enums"]["user_role"]
          total_balance_due?: number | null
          total_copay_amounts?: number | null
          user_id?: number
        }
        Update: {
          email?: string
          first_name?: string
          health_profile?: string | null
          last_name?: string
          password_hash?: string
          role?: Database["public"]["Enums"]["user_role"]
          total_balance_due?: number | null
          total_copay_amounts?: number | null
          user_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "user" | "admin"
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
