// Auto-generated Supabase types
// Generated: 2026-04-18 with complete AppSettings schema
// Project: dsruuvvbeudbkdpevgwd

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      AppSettings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          company_name: string | null
          logo_url: string | null
          primary_color: string | null
          accent_color: string | null
          secondary_color: string | null
          currency: string | null
          currency_symbol: string | null
          contact_phone: string | null
          contact_email: string | null
          welcome_message: string | null
          driver_app_instructions: string | null
          base_fare: number | null
          price_per_km: number | null
          price_per_minute: number | null
          price_per_hour: number | null
          platform_commission_pct: number | null
          minimum_ride_amount: number | null
          timezone: string | null
          city_traffic_factor: number | null
          eta_speed_kmh: number | null
          require_admin_approval_to_start: boolean | null
          auto_assign_nearest_driver: boolean | null
          destination_required: boolean | null
          allow_driver_cancel: boolean | null
          allow_passenger_cancel: boolean | null
          accept_cars: boolean | null
          accept_motos: boolean | null
          auction_mode_enabled: boolean | null
          auction_primary_radius_km: number | null
          auction_secondary_radius_km: number | null
          auction_timeout_seconds: number | null
          auction_max_drivers: number | null
          auction_max_retries: number | null
          max_concurrent_rides: number | null
          eta_update_interval_seconds: number | null
          driver_location_update_interval_seconds: number | null
          eta_modal_duration_seconds: number | null
          service_flow_update_minutes: number | null
          work_max_hours: number | null
          work_break_interval_minutes: number | null
          work_break_duration_minutes: number | null
          work_long_break_duration_minutes: number | null
          work_rest_trigger_minutes: number | null
          work_rest_ratio: number | null
          work_long_rest_minutes: number | null
          driver_inactivity_timeout_minutes: number | null
          rating_window_minutes: number | null
          payment_timeout_hours: number | null
          search_phase_seconds: number | null
          cutoff_interval_days: number | null
          rejection_rate_warning_threshold: number | null
          rejection_count_threshold: number | null
          soft_block_low_acceptance_rate_enabled: boolean | null
          low_acceptance_rate_threshold: number | null
          low_acceptance_rate_offer_reduction_pct: number | null
          support_whatsapp_number: string | null
          support_whatsapp_message: string | null
          wallet_min_balance: number | null
          notification_sound_type: string | null
          notification_volume: number | null
          notification_interval_seconds: number | null
          require_email_verification: boolean | null
          show_passenger_phone_to_driver: boolean | null
          show_driver_photo_to_passenger: boolean | null
          payment_gateway: string | null
          payment_methods: Json | null
          driver_vehicle_docs: Json | null
          driver_required_docs: Json | null
          features_enabled: Json | null
          nav_config: Json | null
          landing_config: Json | null
          pending_payment_methods: Json | null
          version: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          company_name?: string | null
          logo_url?: string | null
          primary_color?: string | null
          accent_color?: string | null
          secondary_color?: string | null
          currency?: string | null
          currency_symbol?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          welcome_message?: string | null
          driver_app_instructions?: string | null
          base_fare?: number | null
          price_per_km?: number | null
          price_per_minute?: number | null
          price_per_hour?: number | null
          platform_commission_pct?: number | null
          minimum_ride_amount?: number | null
          timezone?: string | null
          city_traffic_factor?: number | null
          eta_speed_kmh?: number | null
          require_admin_approval_to_start?: boolean | null
          auto_assign_nearest_driver?: boolean | null
          destination_required?: boolean | null
          allow_driver_cancel?: boolean | null
          allow_passenger_cancel?: boolean | null
          accept_cars?: boolean | null
          accept_motos?: boolean | null
          auction_mode_enabled?: boolean | null
          auction_primary_radius_km?: number | null
          auction_secondary_radius_km?: number | null
          auction_timeout_seconds?: number | null
          auction_max_drivers?: number | null
          auction_max_retries?: number | null
          max_concurrent_rides?: number | null
          eta_update_interval_seconds?: number | null
          driver_location_update_interval_seconds?: number | null
          eta_modal_duration_seconds?: number | null
          service_flow_update_minutes?: number | null
          work_max_hours?: number | null
          work_break_interval_minutes?: number | null
          work_break_duration_minutes?: number | null
          work_long_break_duration_minutes?: number | null
          work_rest_trigger_minutes?: number | null
          work_rest_ratio?: number | null
          work_long_rest_minutes?: number | null
          driver_inactivity_timeout_minutes?: number | null
          rating_window_minutes?: number | null
          payment_timeout_hours?: number | null
          search_phase_seconds?: number | null
          cutoff_interval_days?: number | null
          rejection_rate_warning_threshold?: number | null
          rejection_count_threshold?: number | null
          soft_block_low_acceptance_rate_enabled?: boolean | null
          low_acceptance_rate_threshold?: number | null
          low_acceptance_rate_offer_reduction_pct?: number | null
          support_whatsapp_number?: string | null
          support_whatsapp_message?: string | null
          wallet_min_balance?: number | null
          notification_sound_type?: string | null
          notification_volume?: number | null
          notification_interval_seconds?: number | null
          require_email_verification?: boolean | null
          show_passenger_phone_to_driver?: boolean | null
          show_driver_photo_to_passenger?: boolean | null
          payment_gateway?: string | null
          payment_methods?: Json | null
          driver_vehicle_docs?: Json | null
          driver_required_docs?: Json | null
          features_enabled?: Json | null
          nav_config?: Json | null
          landing_config?: Json | null
          pending_payment_methods?: Json | null
          version?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          company_name?: string | null
          logo_url?: string | null
          primary_color?: string | null
          accent_color?: string | null
          secondary_color?: string | null
          currency?: string | null
          currency_symbol?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          welcome_message?: string | null
          driver_app_instructions?: string | null
          base_fare?: number | null
          price_per_km?: number | null
          price_per_minute?: number | null
          price_per_hour?: number | null
          platform_commission_pct?: number | null
          minimum_ride_amount?: number | null
          timezone?: string | null
          city_traffic_factor?: number | null
          eta_speed_kmh?: number | null
          require_admin_approval_to_start?: boolean | null
          auto_assign_nearest_driver?: boolean | null
          destination_required?: boolean | null
          allow_driver_cancel?: boolean | null
          allow_passenger_cancel?: boolean | null
          accept_cars?: boolean | null
          accept_motos?: boolean | null
          auction_mode_enabled?: boolean | null
          auction_primary_radius_km?: number | null
          auction_secondary_radius_km?: number | null
          auction_timeout_seconds?: number | null
          auction_max_drivers?: number | null
          auction_max_retries?: number | null
          max_concurrent_rides?: number | null
          eta_update_interval_seconds?: number | null
          driver_location_update_interval_seconds?: number | null
          eta_modal_duration_seconds?: number | null
          service_flow_update_minutes?: number | null
          work_max_hours?: number | null
          work_break_interval_minutes?: number | null
          work_break_duration_minutes?: number | null
          work_long_break_duration_minutes?: number | null
          work_rest_trigger_minutes?: number | null
          work_rest_ratio?: number | null
          work_long_rest_minutes?: number | null
          driver_inactivity_timeout_minutes?: number | null
          rating_window_minutes?: number | null
          payment_timeout_hours?: number | null
          search_phase_seconds?: number | null
          cutoff_interval_days?: number | null
          rejection_rate_warning_threshold?: number | null
          rejection_count_threshold?: number | null
          soft_block_low_acceptance_rate_enabled?: boolean | null
          low_acceptance_rate_threshold?: number | null
          low_acceptance_rate_offer_reduction_pct?: number | null
          support_whatsapp_number?: string | null
          support_whatsapp_message?: string | null
          wallet_min_balance?: number | null
          notification_sound_type?: string | null
          notification_volume?: number | null
          notification_interval_seconds?: number | null
          require_email_verification?: boolean | null
          show_passenger_phone_to_driver?: boolean | null
          show_driver_photo_to_passenger?: boolean | null
          payment_gateway?: string | null
          payment_methods?: Json | null
          driver_vehicle_docs?: Json | null
          driver_required_docs?: Json | null
          features_enabled?: Json | null
          nav_config?: Json | null
          landing_config?: Json | null
          pending_payment_methods?: Json | null
          version?: number | null
          notes?: string | null
        }
      }
      RideRequest: {
        Row: {
          id: string
          service_id: string | null
          passenger_name: string | null
          passenger_phone: string | null
          pickup_address: string | null
          dropoff_address: string | null
          service_type_id: string | null
          service_type_name: string | null
          city_id: string | null
          city_name: string | null
          driver_id: string | null
          driver_name: string | null
          requested_at: string | null
          status: string | null
          assignment_mode: string | null
          estimated_price: number | null
          final_price: number | null
          cancellation_fee: number | null
          driver_earnings: number | null
          platform_commission: number | null
          commission_rate: number | null
          paid_by: string | null
          pickup_lat: number | null
          pickup_lon: number | null
          dropoff_lat: number | null
          dropoff_lon: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          pickup_address?: string | null
          dropoff_address?: string | null
          service_type_id?: string | null
          service_type_name?: string | null
          city_id?: string | null
          city_name?: string | null
          driver_id?: string | null
          driver_name?: string | null
          requested_at?: string | null
          status?: string | null
          assignment_mode?: string | null
          estimated_price?: number | null
          final_price?: number | null
          cancellation_fee?: number | null
          driver_earnings?: number | null
          platform_commission?: number | null
          commission_rate?: number | null
          paid_by?: string | null
          pickup_lat?: number | null
          pickup_lon?: number | null
          dropoff_lat?: number | null
          dropoff_lon?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          pickup_address?: string | null
          dropoff_address?: string | null
          service_type_id?: string | null
          service_type_name?: string | null
          city_id?: string | null
          city_name?: string | null
          driver_id?: string | null
          driver_name?: string | null
          requested_at?: string | null
          status?: string | null
          assignment_mode?: string | null
          estimated_price?: number | null
          final_price?: number | null
          cancellation_fee?: number | null
          driver_earnings?: number | null
          platform_commission?: number | null
          commission_rate?: number | null
          paid_by?: string | null
          pickup_lat?: number | null
          pickup_lon?: number | null
          dropoff_lat?: number | null
          dropoff_lon?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
