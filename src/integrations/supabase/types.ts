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
      campaigns: {
        Row: {
          converted_count: number | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          opened_count: number | null
          scheduled_at: string | null
          sent_count: number | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          converted_count?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          converted_count?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          id: string
          loyalty_points: number | null
          name: string
          phone: string
          total_purchases: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name: string
          phone: string
          total_purchases?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name?: string
          phone?: string
          total_purchases?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      data_exports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          export_type: string
          file_url: string | null
          format: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_type: string
          file_url?: string | null
          format: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_type?: string
          file_url?: string | null
          format?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_sessions: {
        Row: {
          created_at: string
          employee_id: string
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          expires_at: string
          id?: string
          session_token: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          email: string | null
          employee_id: string
          id: string
          is_active: boolean | null
          name: string
          password_hash: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          employee_id: string
          id?: string
          is_active?: boolean | null
          name: string
          password_hash: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          employee_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          created_at: string
          created_by: string | null
          current_value: number
          customer_id: string | null
          customer_name: string
          id: string
          invested_amount: number
          metal_type: string
          profit_percentage: number
          quantity: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_value: number
          customer_id?: string | null
          customer_name: string
          id?: string
          invested_amount: number
          metal_type: string
          profit_percentage?: number
          quantity: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_value?: number
          customer_id?: string | null
          customer_name?: string
          id?: string
          invested_amount?: number
          metal_type?: string
          profit_percentage?: number
          quantity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          icon: string | null
          id: string
          is_read: boolean
          message: string
          priority: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          message: string
          priority?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          message?: string
          priority?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          metal_type: string
          name: string
          sku: string
          status: string
          stock: number
          unit_price: number
          updated_at: string
          weight: number
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          metal_type: string
          name: string
          sku: string
          status?: string
          stock?: number
          unit_price: number
          updated_at?: string
          weight: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metal_type?: string
          name?: string
          sku?: string
          status?: string
          stock?: number
          unit_price?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          discount: number
          id: string
          invoice_number: string
          items: Json
          payment_method: string
          status: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number
          id?: string
          invoice_number: string
          items?: Json
          payment_method?: string
          status?: string
          subtotal: number
          tax?: number
          total: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number
          id?: string
          invoice_number?: string
          items?: Json
          payment_method?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          auto_backup: boolean | null
          backup_frequency: string | null
          created_at: string
          currency: string | null
          id: string
          language: string
          last_backup_at: string | null
          region: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_backup?: boolean | null
          backup_frequency?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          language?: string
          last_backup_at?: string | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_backup?: boolean | null
          backup_frequency?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          language?: string
          last_backup_at?: string | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_own_profile: { Args: { profile_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
