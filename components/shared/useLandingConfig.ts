"use client"

import { useQuery } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";

export interface LandingConfig {
  // Benefits section
  benefits_label?: string;
  benefits_title?: string;
  benefits_title_highlight?: string;
  benefits_description?: string;
  stat1_val?: string;
  stat1_label?: string;
  stat2_val?: string;
  stat2_label?: string;
  stat3_val?: string;
  stat3_label?: string;
  benefits?: Array<{
    title: string;
    desc: string;
  }>;

  // CTA section
  cta_title?: string;
  cta_title_highlight?: string;
  cta_subtitle?: string;
  cta_button_label?: string;
  cta_button_url?: string;
  cta_note?: string;
  extra_buttons?: Array<{
    label: string;
    url: string;
    style?: string;
  }>;

  // Hero section
  hero_badge?: string;
  hero_title?: string;
  hero_title_highlight?: string;
  hero_subtitle?: string;
  hero_badge1?: string;
  hero_badge2?: string;
  hero_badge3?: string;
  hero_cta_primary_label?: string;
  hero_cta_primary_url?: string;
  hero_cta_secondary_label?: string;
  hero_cta_secondary_url?: string;

  // Footer section
  footer_links?: Array<{
    label: string;
    url: string;
  }>;
  brand_logo_url?: string;
  brand_name?: string;

  // Services section
  services_title?: string;
  services_subtitle?: string;
  services_description?: string;
  services?: Array<{
    title: string;
    desc: string;
  }>;

  // Other landing config properties can be added here
  [key: string]: any;
}

export default function useLandingConfig(): LandingConfig {
  const { data: config = {} as LandingConfig, ...query } = useQuery({
    queryKey: ["landing-config"],
    queryFn: async () => {
      try {
        // Try to get landing config from Supabase
        const result = await supabaseApi.settings.list();
        const settings = result?.[0] || {};

        // Return landing config with defaults
        return {
          benefits_label: "BENEFICIOS",
          benefits_title: "Por qué elegir",
          benefits_title_highlight: "YAJA",
          benefits_description: "La mejor experiencia de transporte con tecnología de vanguardia y conductores verificados.",
          stat1_val: "50K+",
          stat1_label: "Viajes completados",
          stat2_val: "4.8★",
          stat2_label: "Calificación promedio",
          stat3_val: "24/7",
          stat3_label: "Servicio disponible",
          benefits: [
            {
              title: "Conductores verificados",
              desc: "Todos nuestros conductores pasan por un riguroso proceso de verificación."
            },
            {
              title: "Rastreo en tiempo real",
              desc: "Sigue tu viaje en tiempo real desde la app."
            },
            {
              title: "Pagos seguros",
              desc: "Múltiples formas de pago con total seguridad."
            },
            {
              title: "Soporte 24/7",
              desc: "Atención al cliente disponible todo el día."
            }
          ],
          ...settings.landing_config,
        } as LandingConfig;
      } catch (error) {
        console.warn("Failed to load landing config, using defaults:", error);
        // Return default config
        return {
          benefits_label: "BENEFICIOS",
          benefits_title: "Por qué elegir",
          benefits_title_highlight: "YAJA",
          benefits_description: "La mejor experiencia de transporte con tecnología de vanguardia y conductores verificados.",
          stat1_val: "50K+",
          stat1_label: "Viajes completados",
          stat2_val: "4.8★",
          stat2_label: "Calificación promedio",
          stat3_val: "24/7",
          stat3_label: "Servicio disponible",
          benefits: [
            {
              title: "Conductores verificados",
              desc: "Todos nuestros conductores pasan por un riguroso proceso de verificación."
            },
            {
              title: "Rastreo en tiempo real",
              desc: "Sigue tu viaje en tiempo real desde la app."
            },
            {
              title: "Pagos seguros",
              desc: "Múltiples formas de pago con total seguridad."
            },
            {
              title: "Soporte 24/7",
              desc: "Atención al cliente disponible todo el día."
            }
          ],
        } as LandingConfig;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return config;
}