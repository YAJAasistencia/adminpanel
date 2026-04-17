/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Database Types
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tipos TypeScript generados desde el esquema de Supabase
 */

export type Database = {
  public: {
    Tables: {
      City: {
        Row: {
          id: string;
          name: string;
          country: string | null;
          state: string | null;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['City']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['City']['Insert']>;
      };
      ServiceType: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          description: string | null;
          base_price: number;
          per_km_price: number;
          per_minute_price: number;
          minimum_price: number;
          commission_rate: number;
          is_active: boolean;
          requires_proof_photo: boolean;
          requires_admin_approval: boolean;
          icon_name: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ServiceType']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ServiceType']['Insert']>;
      };
      GeoZone: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          center_lat: number;
          center_lng: number;
          radius_km: number;
          city_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GeoZone']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['GeoZone']['Insert']>;
      };
      RedZone: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          center_lat: number;
          center_lng: number;
          radius_km: number;
          city_id: string | null;
          reason: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['RedZone']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['RedZone']['Insert']>;
      };
      surveys: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          questions: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['surveys']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['surveys']['Insert']>;
      };
      Company: {
        Row: {
          id: string;
          razon_social: string;
          rfc: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          address: string | null;
          city_id: string | null;
          invoice_email: string | null;
          estimated_monthly_rides: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          zone_prices: any;
          folio_fields: any;
          folio_secundario_fields: any;
          sub_accounts: any;
          tax_pct: number;
          billing_type: string;
          survey_id: string | null;
          survey_title: string | null;
          parent_company_id: string | null;
          parent_company_name: string | null;
          sub_company_limit: number;
        };
        Insert: Omit<Database['public']['Tables']['Company']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['Company']['Insert']>;
      };
      Driver: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string;
          password: string | null;
          city_id: string | null;
          latitude: number | null;
          longitude: number | null;
          rating: number;
          total_rides: number;
          total_earnings: number;
          photo_url: string | null;
          vehicles: any;
          commission_rate: number;
          doc_expiries: any;
          suspended_until: string | null;
          approval_status: string;
          rejection_reason: string | null;
          admin_notes: string | null;
          access_code: string | null;
          online_since: string | null;
          accumulated_work_minutes: number;
          rest_required_until: string | null;
          last_disconnect_reason: string | null;
          vehicle_brand: string | null;
          vehicle_model: string | null;
          vehicle_year: number | null;
          vehicle_color: string | null;
          license_plate: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['Driver']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['Driver']['Insert']>;
      };
      RideRequest: {
        Row: {
          id: string;
          service_id: string | null;
          passenger_name: string;
          passenger_phone: string | null;
          passenger_user_id: string | null;
          pickup_address: string;
          dropoff_address: string | null;
          pickup_lat: number | null;
          pickup_lon: number | null;
          dropoff_lat: number | null;
          dropoff_lon: number | null;
          status: string;
          assignment_mode: string;
          auction_expires_at: string | null;
          driver_id: string | null;
          driver_name: string | null;
          city_id: string | null;
          city_name: string | null;
          service_type_id: string | null;
          service_type_name: string | null;
          company_id: string | null;
          company_name: string | null;
          ride_type: string;
          geo_zone_id: string | null;
          geo_zone_name: string | null;
          estimated_price: number | null;
          final_price: number | null;
          company_price: number | null;
          driver_earnings: number | null;
          driver_earnings_base: number | null;
          payment_method: string | null;
          paid_by: string | null;
          commission_rate: number | null;
          distance_km: number | null;
          duration_minutes: number | null;
          rating: number | null;
          admin_rating: number | null;
          notes: string | null;
          proof_photo_url: string | null;
          proof_photo_required: boolean;
          require_admin_approval: boolean;
          show_phone_to_driver: boolean;
          is_scheduled: boolean;
          scheduled_time: string | null;
          is_gasoline: boolean;
          gasoline_liters: number | null;
          is_red_zone_blocked: boolean;
          questionnaire_answers: any;
          folio_data: any;
          created_by: string | null;
          requested_at: string | null;
          created_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['RideRequest']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['RideRequest']['Insert']>;
      };
      Invoice: {
        Row: {
          id: string;
          invoice_number: string;
          company_id: string;
          company_name: string | null;
          ride_ids: string[];
          service_ids: string[];
          period_from: string | null;
          period_to: string | null;
          ride_count: number;
          subtotal: number;
          tax_pct: number;
          tax_amount: number;
          total: number;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['Invoice']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['Invoice']['Insert']>;
      };
      AdminUser: {
        Row: {
          id: string;
          email: string;
          password: string | null;
          name: string | null;
          role: 'admin' | 'manager' | 'operator' | 'viewer' | 'Administrador' | 'Gestor' | 'Operador';
          permissions: any;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['AdminUser']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['AdminUser']['Insert']>;
      };
      BonusRule: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          rule_type: string;
          triggers: any;
          reward: any;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['BonusRule']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['BonusRule']['Insert']>;
      };
      BonusLog: {
        Row: {
          id: string;
          driver_id: string;
          bonus_rule_id: string | null;
          bonus_type: string | null;
          amount: number | null;
          reason: string | null;
          ride_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['BonusLog']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['BonusLog']['Insert']>;
      };
      SosAlert: {
        Row: {
          id: string;
          ride_id: string | null;
          driver_id: string | null;
          passenger_name: string | null;
          location_lat: number | null;
          location_lng: number | null;
          alert_type: string;
          description: string | null;
          status: string;
          responder_id: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['SosAlert']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['SosAlert']['Insert']>;
      };
      SupportTicket: {
        Row: {
          id: string;
          ticket_number: string;
          driver_id: string | null;
          ride_id: string | null;
          subject: string;
          description: string | null;
          category: string;
          priority: string;
          status: string;
          assigned_to: string | null;
          messages: any;
          resolution_notes: string | null;
          created_at: string;
          resolved_at: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['SupportTicket']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['SupportTicket']['Insert']>;
      };
      SurveyResponse: {
        Row: {
          id: string;
          survey_id: string;
          ride_id: string | null;
          driver_id: string | null;
          company_id: string | null;
          answers: any;
          rating: number | null;
          comments: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['SurveyResponse']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['SurveyResponse']['Insert']>;
      };
      DriverNotification: {
        Row: {
          id: string;
          driver_id: string;
          ride_id: string | null;
          title: string;
          body: string | null;
          notification_type: string;
          is_read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['DriverNotification']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['DriverNotification']['Insert']>;
      };
      chat_messages: {
        Row: {
          id: string;
          ride_id: string | null;
          sender_type: string;
          sender_id: string | null;
          sender_name: string | null;
          message_text: string;
          message_type: string;
          media_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>;
      };
      cancellation_policies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          cancellation_fee: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cancellation_policies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cancellation_policies']['Insert']>;
      };
      AppSettings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: any;
          description: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['AppSettings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['AppSettings']['Insert']>;
      };
    };
  };
};
