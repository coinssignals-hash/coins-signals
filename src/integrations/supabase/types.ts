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
      account_snapshots: {
        Row: {
          buying_power: number | null
          cash_balance: number
          connection_id: string
          created_at: string | null
          equity: number
          id: string
          long_exposure: number | null
          maintenance_margin: number | null
          margin_available: number | null
          margin_used: number | null
          net_exposure: number | null
          portfolio_value: number
          realized_pnl_today: number | null
          realized_pnl_total: number | null
          short_exposure: number | null
          snapshot_at: string
          snapshot_data: Json | null
          total_open_orders_count: number | null
          total_positions_count: number | null
          unrealized_pnl: number | null
          user_id: string
        }
        Insert: {
          buying_power?: number | null
          cash_balance?: number
          connection_id: string
          created_at?: string | null
          equity?: number
          id?: string
          long_exposure?: number | null
          maintenance_margin?: number | null
          margin_available?: number | null
          margin_used?: number | null
          net_exposure?: number | null
          portfolio_value?: number
          realized_pnl_today?: number | null
          realized_pnl_total?: number | null
          short_exposure?: number | null
          snapshot_at?: string
          snapshot_data?: Json | null
          total_open_orders_count?: number | null
          total_positions_count?: number | null
          unrealized_pnl?: number | null
          user_id: string
        }
        Update: {
          buying_power?: number | null
          cash_balance?: number
          connection_id?: string
          created_at?: string | null
          equity?: number
          id?: string
          long_exposure?: number | null
          maintenance_margin?: number | null
          margin_available?: number | null
          margin_used?: number | null
          net_exposure?: number | null
          portfolio_value?: number
          realized_pnl_today?: number | null
          realized_pnl_total?: number | null
          short_exposure?: number | null
          snapshot_at?: string
          snapshot_data?: Json | null
          total_open_orders_count?: number | null
          total_positions_count?: number | null
          unrealized_pnl?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_snapshots_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "user_broker_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analysis_cache: {
        Row: {
          analysis_data: Json
          analysis_type: string
          created_at: string
          current_price: number | null
          expires_at: string
          id: string
          symbol: string
        }
        Insert: {
          analysis_data: Json
          analysis_type: string
          created_at?: string
          current_price?: number | null
          expires_at?: string
          id?: string
          symbol: string
        }
        Update: {
          analysis_data?: Json
          analysis_type?: string
          created_at?: string
          current_price?: number | null
          expires_at?: string
          id?: string
          symbol?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      brokers: {
        Row: {
          api_documentation_url: string | null
          auth_type: string
          base_url_demo: string | null
          base_url_live: string | null
          code: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          metadata: Json | null
          min_deposit: number | null
          requires_2fa: boolean | null
          supported_assets: string[]
          supported_order_types: string[]
          supports_websocket: boolean | null
          trading_fees_description: string | null
          updated_at: string | null
          websocket_url_demo: string | null
          websocket_url_live: string | null
        }
        Insert: {
          api_documentation_url?: string | null
          auth_type: string
          base_url_demo?: string | null
          base_url_live?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          min_deposit?: number | null
          requires_2fa?: boolean | null
          supported_assets?: string[]
          supported_order_types?: string[]
          supports_websocket?: boolean | null
          trading_fees_description?: string | null
          updated_at?: string | null
          websocket_url_demo?: string | null
          websocket_url_live?: string | null
        }
        Update: {
          api_documentation_url?: string | null
          auth_type?: string
          base_url_demo?: string | null
          base_url_live?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          min_deposit?: number | null
          requires_2fa?: boolean | null
          supported_assets?: string[]
          supported_order_types?: string[]
          supports_websocket?: boolean | null
          trading_fees_description?: string | null
          updated_at?: string | null
          websocket_url_demo?: string | null
          websocket_url_live?: string | null
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          last_watched_at: string | null
          lesson_id: string
          updated_at: string
          user_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_watched_at?: string | null
          lesson_id: string
          updated_at?: string
          user_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_watched_at?: string | null
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watched_seconds?: number | null
        }
        Relationships: []
      }
      favorite_currencies: {
        Row: {
          created_at: string
          currency: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_signals: {
        Row: {
          created_at: string
          id: string
          signal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_signals_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_symbols: {
        Row: {
          created_at: string
          id: string
          symbol: string
          symbol_name: string | null
          symbol_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          symbol: string
          symbol_name?: string | null
          symbol_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          symbol?: string
          symbol_name?: string | null
          symbol_type?: string
          user_id?: string
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          indicator: string
          interval: string
          source: string | null
          symbol: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at?: string
          id?: string
          indicator?: string
          interval: string
          source?: string | null
          symbol: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          indicator?: string
          interval?: string
          source?: string | null
          symbol?: string
        }
        Relationships: []
      }
      news_ai_analysis_cache: {
        Row: {
          analysis_data: Json
          created_at: string
          expires_at: string
          id: string
          news_id: string
          news_title: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string
          expires_at?: string
          id?: string
          news_id: string
          news_title: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          expires_at?: string
          id?: string
          news_id?: string
          news_title?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          asset_type: string
          average_fill_price: number | null
          broker_order_id: string | null
          cancelled_at: string | null
          client_order_id: string
          connection_id: string
          created_at: string | null
          expires_at: string | null
          filled_at: string | null
          filled_quantity: number | null
          id: string
          limit_price: number | null
          metadata: Json | null
          order_type: string
          quantity: number
          rejection_reason: string | null
          side: string
          status: string
          stop_loss_price: number | null
          stop_price: number | null
          submitted_at: string | null
          symbol: string
          take_profit_price: number | null
          time_in_force: string
          trailing_amount: number | null
          trailing_percent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          average_fill_price?: number | null
          broker_order_id?: string | null
          cancelled_at?: string | null
          client_order_id: string
          connection_id: string
          created_at?: string | null
          expires_at?: string | null
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          limit_price?: number | null
          metadata?: Json | null
          order_type: string
          quantity: number
          rejection_reason?: string | null
          side: string
          status?: string
          stop_loss_price?: number | null
          stop_price?: number | null
          submitted_at?: string | null
          symbol: string
          take_profit_price?: number | null
          time_in_force?: string
          trailing_amount?: number | null
          trailing_percent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          average_fill_price?: number | null
          broker_order_id?: string | null
          cancelled_at?: string | null
          client_order_id?: string
          connection_id?: string
          created_at?: string | null
          expires_at?: string | null
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          limit_price?: number | null
          metadata?: Json | null
          order_type?: string
          quantity?: number
          rejection_reason?: string | null
          side?: string
          status?: string
          stop_loss_price?: number | null
          stop_price?: number | null
          submitted_at?: string | null
          symbol?: string
          take_profit_price?: number | null
          time_in_force?: string
          trailing_amount?: number | null
          trailing_percent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "user_broker_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          asset_type: string
          available_quantity: number
          average_entry_price: number
          connection_id: string
          created_at: string | null
          current_price: number | null
          id: string
          last_price_update_at: string | null
          market_value: number | null
          metadata: Json | null
          quantity: number
          realized_pnl: number | null
          symbol: string
          total_commission: number | null
          total_cost: number
          total_fees: number | null
          unrealized_pnl: number | null
          unrealized_pnl_percent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          available_quantity?: number
          average_entry_price: number
          connection_id: string
          created_at?: string | null
          current_price?: number | null
          id?: string
          last_price_update_at?: string | null
          market_value?: number | null
          metadata?: Json | null
          quantity: number
          realized_pnl?: number | null
          symbol: string
          total_commission?: number | null
          total_cost?: number
          total_fees?: number | null
          unrealized_pnl?: number | null
          unrealized_pnl_percent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          available_quantity?: number
          average_entry_price?: number
          connection_id?: string
          created_at?: string | null
          current_price?: number | null
          id?: string
          last_price_update_at?: string | null
          market_value?: number | null
          metadata?: Json | null
          quantity?: number
          realized_pnl?: number | null
          symbol?: string
          total_commission?: number | null
          total_cost?: number
          total_fees?: number | null
          unrealized_pnl?: number | null
          unrealized_pnl_percent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "user_broker_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email_notifications_enabled: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          push_notifications_enabled: boolean | null
          signal_alerts_enabled: boolean | null
          timezone: string | null
          trading_mode: string | null
          updated_at: string
          whatsapp_notifications_enabled: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email_notifications_enabled?: boolean | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          push_notifications_enabled?: boolean | null
          signal_alerts_enabled?: boolean | null
          timezone?: string | null
          trading_mode?: string | null
          updated_at?: string
          whatsapp_notifications_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email_notifications_enabled?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          push_notifications_enabled?: boolean | null
          signal_alerts_enabled?: boolean | null
          timezone?: string | null
          trading_mode?: string | null
          updated_at?: string
          whatsapp_notifications_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          reward_amount: number
          reward_days: number
          reward_type: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          reward_amount?: number
          reward_days?: number
          reward_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
          reward_days?: number
          reward_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      signal_ai_analysis_history: {
        Row: {
          analysis_text: string
          confidence_level: number | null
          created_at: string
          id: string
          recommendation: string | null
          risk_level: string | null
          signal_id: string
          user_id: string | null
        }
        Insert: {
          analysis_text: string
          confidence_level?: number | null
          created_at?: string
          id?: string
          recommendation?: string | null
          risk_level?: string | null
          signal_id: string
          user_id?: string | null
        }
        Update: {
          analysis_text?: string
          confidence_level?: number | null
          created_at?: string
          id?: string
          recommendation?: string | null
          risk_level?: string | null
          signal_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_ai_analysis_history_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_price_alerts: {
        Row: {
          created_at: string
          direction: string
          id: string
          is_triggered: boolean
          symbol: string
          symbol_name: string | null
          target_price: number
          triggered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction?: string
          id?: string
          is_triggered?: boolean
          symbol: string
          symbol_name?: string | null
          target_price: number
          triggered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          is_triggered?: boolean
          symbol?: string
          symbol_name?: string | null
          target_price?: number
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          broker_trade_id: string | null
          commission: number | null
          connection_id: string
          created_at: string | null
          executed_at: string
          fees: number | null
          id: string
          metadata: Json | null
          order_id: string
          price: number
          quantity: number
          side: string
          symbol: string
          user_id: string
        }
        Insert: {
          broker_trade_id?: string | null
          commission?: number | null
          connection_id: string
          created_at?: string | null
          executed_at?: string
          fees?: number | null
          id?: string
          metadata?: Json | null
          order_id: string
          price: number
          quantity: number
          side: string
          symbol: string
          user_id: string
        }
        Update: {
          broker_trade_id?: string | null
          commission?: number | null
          connection_id?: string
          created_at?: string | null
          executed_at?: string
          fees?: number | null
          id?: string
          metadata?: Json | null
          order_id?: string
          price?: number
          quantity?: number
          side?: string
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "user_broker_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_signals: {
        Row: {
          action: string
          analysis_data: Json | null
          chart_image_url: string | null
          closed_price: number | null
          closed_result: string | null
          created_at: string
          currency_pair: string
          datetime: string
          entry_price: number
          id: string
          notes: string | null
          probability: number
          resistance: number | null
          session_data: Json | null
          status: string
          stop_loss: number
          support: number | null
          take_profit: number
          take_profit_2: number | null
          take_profit_3: number | null
          trend: string
          updated_at: string
        }
        Insert: {
          action?: string
          analysis_data?: Json | null
          chart_image_url?: string | null
          closed_price?: number | null
          closed_result?: string | null
          created_at?: string
          currency_pair: string
          datetime?: string
          entry_price: number
          id?: string
          notes?: string | null
          probability?: number
          resistance?: number | null
          session_data?: Json | null
          status?: string
          stop_loss: number
          support?: number | null
          take_profit: number
          take_profit_2?: number | null
          take_profit_3?: number | null
          trend?: string
          updated_at?: string
        }
        Update: {
          action?: string
          analysis_data?: Json | null
          chart_image_url?: string | null
          closed_price?: number | null
          closed_result?: string | null
          created_at?: string
          currency_pair?: string
          datetime?: string
          entry_price?: number
          id?: string
          notes?: string | null
          probability?: number
          resistance?: number | null
          session_data?: Json | null
          status?: string
          stop_loss?: number
          support?: number | null
          take_profit?: number
          take_profit_2?: number | null
          take_profit_3?: number | null
          trend?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_alert_configs: {
        Row: {
          config: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_broker_connections: {
        Row: {
          broker_id: string
          config: Json | null
          connection_error: string | null
          connection_name: string
          created_at: string | null
          credentials_iv: string | null
          encrypted_credentials: string
          environment: string
          id: string
          is_active: boolean | null
          is_connected: boolean | null
          last_connected_at: string | null
          last_sync_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broker_id: string
          config?: Json | null
          connection_error?: string | null
          connection_name: string
          created_at?: string | null
          credentials_iv?: string | null
          encrypted_credentials: string
          environment?: string
          id?: string
          is_active?: boolean | null
          is_connected?: boolean | null
          last_connected_at?: string | null
          last_sync_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broker_id?: string
          config?: Json | null
          connection_error?: string | null
          connection_name?: string
          created_at?: string | null
          credentials_iv?: string | null
          encrypted_credentials?: string
          environment?: string
          id?: string
          is_active?: boolean | null
          is_connected?: boolean | null
          last_connected_at?: string | null
          last_sync_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_broker_connections_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          review_notes: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          mime_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
