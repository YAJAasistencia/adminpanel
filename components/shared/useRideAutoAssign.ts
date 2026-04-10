"use client"

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import type { AppSettings } from "./useAppSettings";

interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_km: number;
}

export default function useRideAutoAssign(settings: AppSettings | undefined, cities: City[]) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Auto-assign logic
  const performAutoAssign = async () => {
    if (!settings?.auto_assign_enabled) return;

    try {
      // Get pending rides
      const pendingRides = await supabaseApi.rideRequests.list({
        status: "pending"
      });

      for (const ride of pendingRides) {
        // Find available drivers in the area
        const availableDrivers = await supabaseApi.drivers.list({
          status: "available",
          service_type_id: ride.service_type_id,
          city_id: ride.city_id
        });

        if (availableDrivers.length > 0) {
          // Simple auto-assign: pick the first available driver
          const selectedDriver = availableDrivers[0];

          // Update ride with assigned driver
          await supabaseApi.rideRequests.update(ride.id, {
            ...ride,
            driver_id: selectedDriver.id,
            status: "assigned"
          });

          // Update driver status
          await supabaseApi.drivers.update(selectedDriver.id, {
            ...selectedDriver,
            status: "busy"
          });

          console.log(`Auto-assigned ride ${ride.id} to driver ${selectedDriver.id}`);
        }
      }

      // Invalidate relevant queries to refresh UI
      if (pendingRides.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
        queryClient.invalidateQueries({ queryKey: ["rides"] });
        queryClient.invalidateQueries({ queryKey: ["drivers"] });
      }
    } catch (error) {
      console.error("Auto-assign error:", error);
    }
  };

  // Set up auto-assign interval
  useEffect(() => {
    if (!settings?.auto_assign_enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // Run auto-assign every 30 seconds
    intervalRef.current = setInterval(performAutoAssign, 30000);

    // Run immediately on mount/enable
    performAutoAssign();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings?.auto_assign_enabled, cities]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}