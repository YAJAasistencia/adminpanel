// Auto-generated Supabase types from schema audit
// Generated: 2026-04-18 Schema Audit Report
// Verified: All 188 fields across 4 tables

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      AppSettings: {
        Row: {
          id: string
          company_name: string | null
          logo_url: string | null
          primary_color: string | null
          accent_color: string | null
          secondary_color: string | null
          currency: string | null
          contact_phone: string | null
          contact_email: string | null
          base_fare: number | null
          price_per_km: number | null
          price_per_minute: number | null
          platform_commission_pct: number | null
          require_admin_approval_to_start: boolean | null
          auto_assign_nearest_driver: boolean | null
          destination_required: boolean | null
          allow_driver_cancel: boolean | null
          rating_window_minutes: number | null
          require_email_verification: boolean | null
          accept_cars: boolean | null
          accept_motos: boolean | null
          auction_mode_enabled: boolean | null
          welcome_message: string | null
          driver_app_instructions: string | null
          payment_timeout_hours: number | null
          wallet_min_balance: number | null
          timezone: string | null
          auction_primary_radius_km: number | null
          auction_secondary_radius_km: number | null
          auction_timeout_seconds: number | null
          auction_max_drivers: number | null
          notification_interval_seconds: number | null
          notification_volume: number | null
          notification_sound_type: string | null
          cutoff_interval_days: number | null
          eta_update_interval_seconds: number | null
          eta_modal_duration_seconds: number | null
          driver_location_update_interval_seconds: number | null
          eta_speed_kmh: number | null
          driver_inactivity_timeout_minutes: number | null
          search_phase_seconds: number | null
          city_traffic_factor: number | null
          service_flow_update_minutes: number | null
          maps_provider: string | null
          google_maps_api_key: string | null
          support_whatsapp_number: Json | null
          support_whatsapp_message: string | null
          features_enabled: Json | null
          payment_methods: Json | null
          payment_gateway: Json | null
          pending_payment_methods: Json | null
          promotions: Json | null
          driver_required_docs: Json | null
          driver_vehicle_docs: Json | null
          nav_config: Json | null
          landing_config: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          company_name?: string | null
          logo_url?: string | null
          primary_color?: string | null
          accent_color?: string | null
          secondary_color?: string | null
          currency?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          base_fare?: number | null
          price_per_km?: number | null
          price_per_minute?: number | null
          platform_commission_pct?: number | null
          require_admin_approval_to_start?: boolean | null
          auto_assign_nearest_driver?: boolean | null
          destination_required?: boolean | null
          allow_driver_cancel?: boolean | null
          rating_window_minutes?: number | null
          require_email_verification?: boolean | null
          accept_cars?: boolean | null
          accept_motos?: boolean | null
          auction_mode_enabled?: boolean | null
          welcome_message?: string | null
          driver_app_instructions?: string | null
          payment_timeout_hours?: number | null
          wallet_min_balance?: number | null
          timezone?: string | null
          auction_primary_radius_km?: number | null
          auction_secondary_radius_km?: number | null
          auction_timeout_seconds?: number | null
          auction_max_drivers?: number | null
          notification_interval_seconds?: number | null
          notification_volume?: number | null
          notification_sound_type?: string | null
          cutoff_interval_days?: number | null
          eta_update_interval_seconds?: number | null
          eta_modal_duration_seconds?: number | null
          driver_location_update_interval_seconds?: number | null
          eta_speed_kmh?: number | null
          driver_inactivity_timeout_minutes?: number | null
          search_phase_seconds?: number | null
          city_traffic_factor?: number | null
          service_flow_update_minutes?: number | null
          maps_provider?: string | null
          google_maps_api_key?: string | null
          support_whatsapp_number?: Json | null
          support_whatsapp_message?: string | null
          features_enabled?: Json | null
          payment_methods?: Json | null
          payment_gateway?: Json | null
          pending_payment_methods?: Json | null
          promotions?: Json | null
          driver_required_docs?: Json | null
          driver_vehicle_docs?: Json | null
          nav_config?: Json | null
          landing_config?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_name?: string | null
          logo_url?: string | null
          primary_color?: string | null
          accent_color?: string | null
          secondary_color?: string | null
          currency?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          base_fare?: number | null
          price_per_km?: number | null
          price_per_minute?: number | null
          platform_commission_pct?: number | null
          require_admin_approval_to_start?: boolean | null
          auto_assign_nearest_driver?: boolean | null
          destination_required?: boolean | null
          allow_driver_cancel?: boolean | null
          rating_window_minutes?: number | null
          require_email_verification?: boolean | null
          accept_cars?: boolean | null
          accept_motos?: boolean | null
          auction_mode_enabled?: boolean | null
          welcome_message?: string | null
          driver_app_instructions?: string | null
          payment_timeout_hours?: number | null
          wallet_min_balance?: number | null
          timezone?: string | null
          auction_primary_radius_km?: number | null
          auction_secondary_radius_km?: number | null
          auction_timeout_seconds?: number | null
          auction_max_drivers?: number | null
          notification_interval_seconds?: number | null
          notification_volume?: number | null
          notification_sound_type?: string | null
          cutoff_interval_days?: number | null
          eta_update_interval_seconds?: number | null
          eta_modal_duration_seconds?: number | null
          driver_location_update_interval_seconds?: number | null
          eta_speed_kmh?: number | null
          driver_inactivity_timeout_minutes?: number | null
          search_phase_seconds?: number | null
          city_traffic_factor?: number | null
          service_flow_update_minutes?: number | null
          maps_provider?: string | null
          google_maps_api_key?: string | null
          support_whatsapp_number?: Json | null
          support_whatsapp_message?: string | null
          features_enabled?: Json | null
          payment_methods?: Json | null
          payment_gateway?: Json | null
          pending_payment_methods?: Json | null
          promotions?: Json | null
          driver_required_docs?: Json | null
          driver_vehicle_docs?: Json | null
          nav_config?: Json | null
          landing_config?: Json | null
          created_at?: string | null
        }
      }
      RideRequest: {
        Row: {
          id: string
          service_id: string | null
          passenger_name: string | null
          passenger_phone: string | null
          show_phone_to_driver: boolean | null
          pickup_address: string | null
          dropoff_address: Json | null
          service_type_id: string | null
          service_type_name: string | null
          city_id: Json | null
          city_name: Json | null
          driver_id: string | null
          driver_name: string | null
          requested_at: string | null
          status: string | null
          payment_status: string | null
          payment_confirmed_by_driver: boolean | null
          payment_reported_unpaid: boolean | null
          assignment_mode: string | null
          auction_driver_ids: Json | null
          auction_expires_at: Json | null
          estimated_price: number | null
          company_price: Json | null
          extra_company_cost: number | null
          final_price: number | null
          driver_earnings: number | null
          platform_commission: number | null
          commission_rate: Json | null
          paid_by: string | null
          cancellation_fee: number | null
          cancellation_reason: string | null
          cancelled_by: string | null
          pickup_lat: number | null
          pickup_lon: number | null
          dropoff_lat: Json | null
          dropoff_lon: Json | null
          geo_zone_id: Json | null
          geo_zone_name: Json | null
          company_id: Json | null
          company_name: Json | null
          ride_type: string | null
          questionnaire_answers: Json | null
          custom_field_answers: Json | null
          is_gasoline: boolean | null
          gasoline_liters: number | null
          passenger_user_id: Json | null
          is_red_zone_blocked: boolean | null
          require_admin_approval: boolean | null
          en_route_at: Json | null
          arrived_at: Json | null
          in_progress_at: Json | null
          completed_at: Json | null
          extra_charges: Json | null
          _admin_edit: boolean | null
          created_at: string | null
          admin_rating: Json | null
          admin_rating_comment: Json | null
          driver_rating_for_passenger: Json | null
          driver_rating_comment: Json | null
          passenger_rating_for_driver: Json | null
          passenger_rating_comment: Json | null
          distance_km: Json | null
          duration_minutes: Json | null
          notes: Json | null
          payment_method: string | null
          proof_photo_required: boolean | null
          proof_photo_url: Json | null
          rating_window_expires_at: Json | null
          scheduled_time: Json | null
        }
        Insert: {
          id?: string
          service_id?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          show_phone_to_driver?: boolean | null
          pickup_address?: string | null
          dropoff_address?: Json | null
          service_type_id?: string | null
          service_type_name?: string | null
          city_id?: Json | null
          city_name?: Json | null
          driver_id?: string | null
          driver_name?: string | null
          requested_at?: string | null
          status?: string | null
          payment_status?: string | null
          payment_confirmed_by_driver?: boolean | null
          payment_reported_unpaid?: boolean | null
          assignment_mode?: string | null
          auction_driver_ids?: Json | null
          auction_expires_at?: Json | null
          estimated_price?: number | null
          company_price?: Json | null
          extra_company_cost?: number | null
          final_price?: number | null
          driver_earnings?: number | null
          platform_commission?: number | null
          commission_rate?: Json | null
          paid_by?: string | null
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          pickup_lat?: number | null
          pickup_lon?: number | null
          dropoff_lat?: Json | null
          dropoff_lon?: Json | null
          geo_zone_id?: Json | null
          geo_zone_name?: Json | null
          company_id?: Json | null
          company_name?: Json | null
          ride_type?: string | null
          questionnaire_answers?: Json | null
          custom_field_answers?: Json | null
          is_gasoline?: boolean | null
          gasoline_liters?: number | null
          passenger_user_id?: Json | null
          is_red_zone_blocked?: boolean | null
          require_admin_approval?: boolean | null
          en_route_at?: Json | null
          arrived_at?: Json | null
          in_progress_at?: Json | null
          completed_at?: Json | null
          extra_charges?: Json | null
          _admin_edit?: boolean | null
          created_at?: string | null
          admin_rating?: Json | null
          admin_rating_comment?: Json | null
          driver_rating_for_passenger?: Json | null
          driver_rating_comment?: Json | null
          passenger_rating_for_driver?: Json | null
          passenger_rating_comment?: Json | null
          distance_km?: Json | null
          duration_minutes?: Json | null
          notes?: Json | null
          payment_method?: string | null
          proof_photo_required?: boolean | null
          proof_photo_url?: Json | null
          rating_window_expires_at?: Json | null
          scheduled_time?: Json | null
        }
        Update: {
          id?: string
          service_id?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          show_phone_to_driver?: boolean | null
          pickup_address?: string | null
          dropoff_address?: Json | null
          service_type_id?: string | null
          service_type_name?: string | null
          city_id?: Json | null
          city_name?: Json | null
          driver_id?: string | null
          driver_name?: string | null
          requested_at?: string | null
          status?: string | null
          payment_status?: string | null
          payment_confirmed_by_driver?: boolean | null
          payment_reported_unpaid?: boolean | null
          assignment_mode?: string | null
          auction_driver_ids?: Json | null
          auction_expires_at?: Json | null
          estimated_price?: number | null
          company_price?: Json | null
          extra_company_cost?: number | null
          final_price?: number | null
          driver_earnings?: number | null
          platform_commission?: number | null
          commission_rate?: Json | null
          paid_by?: string | null
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          pickup_lat?: number | null
          pickup_lon?: number | null
          dropoff_lat?: Json | null
          dropoff_lon?: Json | null
          geo_zone_id?: Json | null
          geo_zone_name?: Json | null
          company_id?: Json | null
          company_name?: Json | null
          ride_type?: string | null
          questionnaire_answers?: Json | null
          custom_field_answers?: Json | null
          is_gasoline?: boolean | null
          gasoline_liters?: number | null
          passenger_user_id?: Json | null
          is_red_zone_blocked?: boolean | null
          require_admin_approval?: boolean | null
          en_route_at?: Json | null
          arrived_at?: Json | null
          in_progress_at?: Json | null
          completed_at?: Json | null
          extra_charges?: Json | null
          _admin_edit?: boolean | null
          created_at?: string | null
          admin_rating?: Json | null
          admin_rating_comment?: Json | null
          driver_rating_for_passenger?: Json | null
          driver_rating_comment?: Json | null
          passenger_rating_for_driver?: Json | null
          passenger_rating_comment?: Json | null
          distance_km?: Json | null
          duration_minutes?: Json | null
          notes?: Json | null
          payment_method?: string | null
          proof_photo_required?: boolean | null
          proof_photo_url?: Json | null
          rating_window_expires_at?: Json | null
          scheduled_time?: Json | null
        }
      }
      Driver: {
        Row: {
          id: string
          full_name: string | null
          phone: Json | null
          email: string | null
          password: string | null
          curp: Json | null
          photo_url: Json | null
          vehicle_brand: Json | null
          vehicle_model: Json | null
          vehicle_year: Json | null
          vehicle_color: Json | null
          license_plate: string | null
          rating: number | null
          rating_count: number | null
          passenger_rating: number | null
          status: string | null
          approval_status: string | null
          service_type_ids: Json | null
          service_type_names: Json | null
          city_id: Json | null
          city_name: Json | null
          total_rides: number | null
          total_earnings: number | null
          commission_rate: number | null
          cutoff_days: number | null
          last_cutoff_date: Json | null
          last_seen_at: Json | null
          online_since: Json | null
          accumulated_work_minutes: number | null
          rest_required_until: Json | null
          access_code: string | null
          latitude: Json | null
          longitude: Json | null
          bank_name: Json | null
          bank_account: Json | null
          bank_clabe: Json | null
          bank_holder: Json | null
          doc_license_url: Json | null
          doc_id_url: Json | null
          doc_vehicle_url: Json | null
          doc_insurance_url: Json | null
          doc_urls: Json | null
          doc_expiries: Json | null
          approved_docs: Json | null
          rejected_docs: Json | null
          rejection_reason: Json | null
          admin_notes: Json | null
          suspended_until: Json | null
          suspension_reason: Json | null
          last_disconnect_reason: Json | null
          vehicles: Json | null
          push_subscription: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          full_name?: string | null
          phone?: Json | null
          email?: string | null
          password?: string | null
          curp?: Json | null
          photo_url?: Json | null
          vehicle_brand?: Json | null
          vehicle_model?: Json | null
          vehicle_year?: Json | null
          vehicle_color?: Json | null
          license_plate?: string | null
          rating?: number | null
          rating_count?: number | null
          passenger_rating?: number | null
          status?: string | null
          approval_status?: string | null
          service_type_ids?: Json | null
          service_type_names?: Json | null
          city_id?: Json | null
          city_name?: Json | null
          total_rides?: number | null
          total_earnings?: number | null
          commission_rate?: number | null
          cutoff_days?: number | null
          last_cutoff_date?: Json | null
          last_seen_at?: Json | null
          online_since?: Json | null
          accumulated_work_minutes?: number | null
          rest_required_until?: Json | null
          access_code?: string | null
          latitude?: Json | null
          longitude?: Json | null
          bank_name?: Json | null
          bank_account?: Json | null
          bank_clabe?: Json | null
          bank_holder?: Json | null
          doc_license_url?: Json | null
          doc_id_url?: Json | null
          doc_vehicle_url?: Json | null
          doc_insurance_url?: Json | null
          doc_urls?: Json | null
          doc_expiries?: Json | null
          approved_docs?: Json | null
          rejected_docs?: Json | null
          rejection_reason?: Json | null
          admin_notes?: Json | null
          suspended_until?: Json | null
          suspension_reason?: Json | null
          last_disconnect_reason?: Json | null
          vehicles?: Json | null
          push_subscription?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: Json | null
          email?: string | null
          password?: string | null
          curp?: Json | null
          photo_url?: Json | null
          vehicle_brand?: Json | null
          vehicle_model?: Json | null
          vehicle_year?: Json | null
          vehicle_color?: Json | null
          license_plate?: string | null
          rating?: number | null
          rating_count?: number | null
          passenger_rating?: number | null
          status?: string | null
          approval_status?: string | null
          service_type_ids?: Json | null
          service_type_names?: Json | null
          city_id?: Json | null
          city_name?: Json | null
          total_rides?: number | null
          total_earnings?: number | null
          commission_rate?: number | null
          cutoff_days?: number | null
          last_cutoff_date?: Json | null
          last_seen_at?: Json | null
          online_since?: Json | null
          accumulated_work_minutes?: number | null
          rest_required_until?: Json | null
          access_code?: string | null
          latitude?: Json | null
          longitude?: Json | null
          bank_name?: Json | null
          bank_account?: Json | null
          bank_clabe?: Json | null
          bank_holder?: Json | null
          doc_license_url?: Json | null
          doc_id_url?: Json | null
          doc_vehicle_url?: Json | null
          doc_insurance_url?: Json | null
          doc_urls?: Json | null
          doc_expiries?: Json | null
          approved_docs?: Json | null
          rejected_docs?: Json | null
          rejection_reason?: Json | null
          admin_notes?: Json | null
          suspended_until?: Json | null
          suspension_reason?: Json | null
          last_disconnect_reason?: Json | null
          vehicles?: Json | null
          push_subscription?: Json | null
          created_at?: string | null
        }
      }
      City: {
        Row: {
          id: string
          name: string | null
          state: string | null
          country: string | null
          is_active: boolean | null
          center_lat: number | null
          center_lon: number | null
          geofence_radius_km: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          state?: string | null
          country?: string | null
          is_active?: boolean | null
          center_lat?: number | null
          center_lon?: number | null
          geofence_radius_km?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          state?: string | null
          country?: string | null
          is_active?: boolean | null
          center_lat?: number | null
          center_lon?: number | null
          geofence_radius_km?: number | null
          created_at?: string | null
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
2026/04/18 06:28:32 Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable.
