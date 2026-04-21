import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface City {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  center_lat?: number;
  center_lon?: number;
  radius_km?: number;
  geofence_radius_km?: number;
  [key: string]: any;
}

interface Ride {
  id: string;
  status?: string;
  driver_id?: string | null;
  driver_name?: string | null;
  pickup_lat?: number;
  pickup_lon?: number;
  service_type_name?: string;
  service_type_id?: string;
  city_id?: string;
  assignment_mode?: string;
  scheduled_time?: string;
  awaiting_payment_confirmation?: boolean;
  payment_status?: string;
  auction_driver_ids?: string[];
  auction_expires_at?: string;
  en_route_at?: string;
  cancellation_reason?: string;
  [key: string]: any;
}

interface Driver {
  id: string;
  status?: string;
  approval_status?: string;
  service_type_names?: string[];
  service_type_ids?: string[];
  city_id?: string;
  latitude?: number;
  longitude?: number;
  full_name?: string;
  [key: string]: any;
}

function getRideCreatedTs(ride: Ride) {
  return new Date(ride.requested_at || 0).getTime();
}

function getRideUpdatedIso(ride: Ride) {
  return ride.requested_at || new Date().toISOString();
}

function uniqueIds(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

function getHaverDist(lat1?: number, lon1?: number, lat2?: number, lon2?: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function useRideAutoAssign(settings: AppSettings | undefined, cities: City[]) {
  const queryClient = useQueryClient();
  const ridesRef = useRef<Ride[]>([]);
  const driversRef = useRef<Driver[]>([]);
  const settingsRef = useRef(settings);
  const citiesRef = useRef(cities);
  const assignTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    citiesRef.current = cities ?? [];
  }, [cities]);

  useEffect(() => {
    ridesRef.current = (queryClient.getQueryData(["rides"]) as Ride[]) ?? [];
    driversRef.current = (queryClient.getQueryData(["drivers"]) as Driver[]) ?? [];

    if (ridesRef.current.length === 0) {
      supabaseApi.rideRequests.list().then((data) => {
        if (data?.length) {
          ridesRef.current = data.slice(0, 100);
          queryClient.setQueryData(["rides"], ridesRef.current);
        }
      }).catch(() => {});
    }

    if (driversRef.current.length === 0) {
      supabaseApi.drivers.list().then((data) => {
        if (data?.length) {
          driversRef.current = data;
          queryClient.setQueryData(["drivers"], data);
        }
      }).catch(() => {});
    }

    const unsub = queryClient.getQueryCache().subscribe(() => {
      const rides = queryClient.getQueryData(["rides"]) as Ride[] | undefined;
      if (rides) ridesRef.current = rides;
      const drivers = queryClient.getQueryData(["drivers"]) as Driver[] | undefined;
      if (drivers) driversRef.current = drivers;
    });

    return unsub;
  }, [queryClient]);

  const getAvailableCandidates = (
    ride: Ride,
    allDrivers: Driver[],
    allRides: Ride[],
    radiusKm: number | null = null,
  ) => {
    const localCities = citiesRef.current;

    // Only exclude drivers who have ACCEPTED a ride (en_route/arrived/in_progress/admin_approved)
    // Drivers with status "assigned" but not yet accepted are still available (driver.status is still "available")
    const busyRideDriverIds = new Set(
      allRides
        .filter((r) => ["en_route", "arrived", "in_progress", "admin_approved"].includes(r.status || "") && r.driver_id)
        .map((r) => r.driver_id as string)
    );

    return allDrivers.filter((driver) => {
      if (driver.status !== "available") return false;
      if (driver.approval_status !== "approved") return false;
      if (busyRideDriverIds.has(driver.id)) return false;

      if (ride.service_type_name) {
        if (!driver.service_type_names?.includes(ride.service_type_name)) return false;
      } else if (ride.service_type_id) {
        if (!driver.service_type_ids?.includes(ride.service_type_id)) return false;
      }

      if (ride.city_id && driver.city_id && driver.city_id !== ride.city_id) return false;

      if (ride.pickup_lat && ride.pickup_lon) {
        const driverCity = localCities.find((city) => city.id === driver.city_id);
        if (driverCity?.center_lat && (driverCity.geofence_radius_km || driverCity.radius_km)) {
          const dist = getHaverDist(ride.pickup_lat, ride.pickup_lon, driverCity.center_lat, driverCity.center_lon);
          if (dist > (driverCity.geofence_radius_km || driverCity.radius_km || 0)) return false;
        }

        if (radiusKm !== null && driver.latitude && driver.longitude) {
          const distToRide = getHaverDist(ride.pickup_lat, ride.pickup_lon, driver.latitude, driver.longitude);
          if (distToRide > radiusKm) return false;
        }
      }

      return true;
    });
  };

  const fetchFreshDrivers = async () => {
    const freshDrivers = await supabaseApi.drivers.list();
    driversRef.current = freshDrivers;
    queryClient.setQueryData(["drivers"], freshDrivers);
    return freshDrivers;
  };

  const autoAssignDriver = async (ride: Ride, excludeDriverIds: string[] = []) => {
    const s = settingsRef.current;
    const allRides = ridesRef.current;
    const primaryRadius = s?.auction_primary_radius_km ?? 5;
    const secondaryRadius = s?.auction_secondary_radius_km ?? 15;

    const allDrivers = await fetchFreshDrivers();

    let candidates = getAvailableCandidates(ride, allDrivers, allRides, primaryRadius)
      .filter((driver) => !excludeDriverIds.includes(driver.id));

    if (candidates.length === 0) {
      candidates = getAvailableCandidates(ride, allDrivers, allRides, secondaryRadius)
        .filter((driver) => !excludeDriverIds.includes(driver.id));
    }

    if (candidates.length === 0) {
      candidates = getAvailableCandidates(ride, allDrivers, allRides, null)
        .filter((driver) => !excludeDriverIds.includes(driver.id));
    }

    if (candidates.length === 0) {
      const rideAge = Date.now() - getRideCreatedTs(ride);
      const minWaitBeforeNoDrivers = 45 * 1000;
      if (ride.assignment_mode !== "manual" && rideAge > minWaitBeforeNoDrivers) {
        await supabaseApi.rideRequests.update(ride.id, {
          status: "no_drivers",
          cancellation_reason: "Sin conductores disponibles",
        });

        queryClient.setQueryData(["rides"], (old: Ride[] = []) =>
          old.map((r) => r.id === ride.id ? { ...r, status: "no_drivers", cancellation_reason: "Sin conductores disponibles" } : r)
        );
      }
      return;
    }

    let sorted = candidates;
    if (ride.pickup_lat && ride.pickup_lon) {
      sorted = [...candidates].sort((left, right) =>
        getHaverDist(ride.pickup_lat, ride.pickup_lon, left.latitude, left.longitude) -
        getHaverDist(ride.pickup_lat, ride.pickup_lon, right.latitude, right.longitude)
      );
    }

    const best = sorted[0];
    const assignedNow = new Date().toISOString();
    queryClient.setQueryData(["lastAssignedDriver"], best);
    queryClient.setQueryData(["rides"], (old: Ride[] = []) =>
      old.map((r) => r.id === ride.id
        ? { ...r, driver_id: best.id, driver_name: best.full_name, status: "assigned", updated_at: assignedNow }
        : r)
    );

    await supabaseApi.rideRequests.update(ride.id, {
      driver_id: best.id,
      driver_name: best.full_name,
      status: "assigned",
    });
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
  };

  const startAuction = async (ride: Ride, excludeDriverIds: string[] = []) => {
    const s = settingsRef.current;
    const allRides = ridesRef.current;
    const primaryRadius = s?.auction_primary_radius_km ?? 5;
    const secondaryRadius = s?.auction_secondary_radius_km ?? 15;
    const maxDrivers = s?.auction_max_drivers ?? 5;
    const isSecondRound = excludeDriverIds.length > 0;

    const allDrivers = await fetchFreshDrivers();
    let candidates: Driver[] = [];

    if (!isSecondRound) {
      candidates = getAvailableCandidates(ride, allDrivers, allRides, primaryRadius)
        .filter((driver) => !excludeDriverIds.includes(driver.id));

      if (candidates.length === 0) {
        candidates = getAvailableCandidates(ride, allDrivers, allRides, secondaryRadius)
          .filter((driver) => !excludeDriverIds.includes(driver.id));
      }
    } else {
      candidates = getAvailableCandidates(ride, allDrivers, allRides, secondaryRadius)
        .filter((driver) => !excludeDriverIds.includes(driver.id));
    }

    if (candidates.length === 0) {
      if (ride.assignment_mode !== "manual") {
        const now = new Date().toISOString();
        const nextUpdate = {
          status: "pending",
          assignment_mode: "manual",
          manual_assignment_requested_at: now,
          driver_id: null,
          auction_driver_ids: [],
        };
        await supabaseApi.rideRequests.update(ride.id, nextUpdate);
        queryClient.setQueryData(["rides"], (old: Ride[] = []) =>
          old.map((r) => r.id === ride.id ? {
            ...r, status: "pending", assignment_mode: "manual",
            manual_assignment_requested_at: now, driver_id: null, auction_driver_ids: []
          } : r)
        );
      }
      return;
    }

    let sorted = candidates;
    if (ride.pickup_lat && ride.pickup_lon) {
      sorted = [...candidates].sort((left, right) =>
        getHaverDist(ride.pickup_lat, ride.pickup_lon, left.latitude, left.longitude) -
        getHaverDist(ride.pickup_lat, ride.pickup_lon, right.latitude, right.longitude)
      );
    }

    const notifyDrivers = sorted.slice(0, maxDrivers);
    const auctionExpiresAt = new Date(Date.now() + (s?.auction_timeout_seconds ?? 30) * 1000).toISOString();

    await supabaseApi.rideRequests.update(ride.id, {
      auction_driver_ids: notifyDrivers.map((driver) => driver.id),
      auction_expires_at: auctionExpiresAt,
      status: "auction",
    });
    queryClient.invalidateQueries({ queryKey: ["rides"] });
  };

  useEffect(() => {
    const channel = supabase
      .channel("autoassign_ride_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ride_requests" }, async (payload: any) => {
        if (payload.eventType === "DELETE") {
          queryClient.setQueryData(["rides"], (old: Ride[] = []) => old.filter((r) => r.id !== payload.old?.id));
          return;
        }

        const data = (payload.new || payload.old) as Ride;
        if (!data?.id) return;

        queryClient.setQueryData(["rides"], (old: Ride[] = []) => {
          if (payload.eventType === "INSERT") return [data, ...old];
          if (payload.eventType === "UPDATE") return old.map((r) => r.id === data.id ? { ...r, ...data } : r);
          return old;
        });

        if (payload.eventType === "INSERT") {
          if (data.status === "scheduled") return;

          if (data.status === "pending" && data.assignment_mode !== "manual") {
            if (data.awaiting_payment_confirmation) return;
            const searchDelaySec = settingsRef.current?.search_phase_seconds ?? 5;
            const createdRideId = data.id;

            setTimeout(async () => {
              const current = await supabaseApi.rideRequests.get(createdRideId).catch(() => null);
              if (!current) return;
              if (current.driver_id || !["pending", "auction"].includes(current.status)) return;

              const s = settingsRef.current;
              const globalAuction = !!s?.auction_mode_enabled;
              if (globalAuction || current.assignment_mode === "auction") {
                await startAuction(current);
              } else {
                await autoAssignDriver(current);
              }
            }, searchDelaySec * 1000);
          }
        }

        if (payload.eventType === "UPDATE") {
          const wasReassignment = Array.isArray(data._excluded_driver_ids) && data._excluded_driver_ids.length > 0;
          if (data.status === "pending" && !data.driver_id && wasReassignment) {
            const excludeIds = data._excluded_driver_ids || [];
            if (data.assignment_mode === "auto" || !data.assignment_mode) {
              await autoAssignDriver(data, excludeIds);
            } else if (data.assignment_mode === "auction") {
              const prevNotified = Array.isArray(data.auction_driver_ids) ? data.auction_driver_ids : [];
              await startAuction(data, prevNotified);
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    const processingRideIds = new Set<string>();

    const checkScheduledAndPending = async () => {
      const now = Date.now();
      const freshRides = await supabaseApi.rideRequests.list().catch(() => [] as Ride[]);
      if (freshRides?.length) {
        ridesRef.current = freshRides.slice(0, 100);
        queryClient.setQueryData(["rides"], (old: Ride[] = []) => {
          const freshIds = new Set(ridesRef.current.map((r) => r.id));
          const recentLocal = (old || []).filter((r) => !freshIds.has(r.id) && (now - getRideCreatedTs(r) < 5000));
          return [...recentLocal, ...ridesRef.current];
        });
      }

      const rides = ridesRef.current;
      const scheduledPending = rides.filter((r) => r.status === "scheduled" && r.scheduled_time && !r.driver_id);
      for (const ride of scheduledPending) {
        const serviceTypes = (queryClient.getQueryData(["serviceTypes"]) as any[]) ?? [];
        const svcType = serviceTypes.find((s: any) => s.name === ride.service_type_name);
        const advanceMinutes = svcType?.advance_assignment_minutes ?? 15;
        const assignAt = new Date(ride.scheduled_time as string).getTime() - advanceMinutes * 60 * 1000;

        if (now >= assignAt) {
          if (ride.assignment_mode === "auto" || !ride.assignment_mode) {
            await autoAssignDriver(ride);
          } else if (ride.assignment_mode === "auction") {
            await startAuction(ride);
          } else if (ride.assignment_mode === "manual") {
            await supabaseApi.rideRequests.update(ride.id, { status: "pending" });
            queryClient.invalidateQueries({ queryKey: ["rides"] });
          }
        }
      }

      const s = settingsRef.current;
      const searchDelaySec = s?.search_phase_seconds ?? 5;
      const rescueRides = rides.filter((r) =>
        (r.status === "pending" || r.status === "auction") &&
        !r.driver_id &&
        r.assignment_mode !== "manual" &&
        !r.scheduled_time &&
        !r.awaiting_payment_confirmation &&
        r.payment_status !== "awaiting_payment" &&
        (now - getRideCreatedTs(r)) > searchDelaySec * 1000 &&
        !processingRideIds.has(r.id)
      );

      for (const ride of rescueRides) {
        if (ride.status === "auction" && ride.auction_expires_at) {
          const expiresAt = new Date(ride.auction_expires_at).getTime();
          if (now < expiresAt) continue;
        }

        processingRideIds.add(ride.id);
        const current = await supabaseApi.rideRequests.get(ride.id).catch(() => null);
        if (!current) {
          processingRideIds.delete(ride.id);
          continue;
        }
        if (current.driver_id || !["pending", "auction"].includes(current.status)) {
          processingRideIds.delete(ride.id);
          continue;
        }

        if (current.status === "auction" && current.auction_expires_at) {
          const expiresAt = new Date(current.auction_expires_at).getTime();
          if (now < expiresAt) {
            processingRideIds.delete(ride.id);
            continue;
          }
        }

        const excludeIds = Array.isArray(current._excluded_driver_ids) ? current._excluded_driver_ids : [];
        const useAuction = !!s?.auction_mode_enabled || current.assignment_mode === "auction";

        if (useAuction) {
          const prevNotified = Array.isArray(current.auction_driver_ids) ? current.auction_driver_ids : [];
          await startAuction(current, uniqueIds([...excludeIds, ...prevNotified]));
        } else {
          await autoAssignDriver(current, excludeIds);
        }

        setTimeout(() => processingRideIds.delete(ride.id), 20000);
      }
    };

    const interval = setInterval(checkScheduledAndPending, 10000);
    checkScheduledAndPending();
    return () => clearInterval(interval);
  }, [queryClient]);

  const assignedRideTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const processedAuctionsRef = useRef(new Set<string>());

  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe(() => {
      const rides = (queryClient.getQueryData(["rides"]) as Ride[]) ?? [];
      const s = settingsRef.current;
      const timeoutMs = (s?.auction_timeout_seconds ?? 30) * 1000;
      const now = Date.now();

      for (const ride of rides) {
        if (
          ride.status === "assigned" &&
          ride.driver_id &&
          !ride.en_route_at &&
          !ride.driver_accepted_at &&
          ride.assignment_mode !== "manual"
        ) {
          if (assignedRideTimersRef.current[ride.id]) continue;

          const assignedAt = new Date(getRideUpdatedIso(ride)).getTime();
          const graceMs = ride.assignment_mode === "auction" ? 3000 : 0;
          const remaining = Math.max(0, timeoutMs + graceMs - (now - assignedAt));

          const timer = setTimeout(async () => {
            delete assignedRideTimersRef.current[ride.id];
            const current = await supabaseApi.rideRequests.get(ride.id).catch(() => null);
            if (!current || current.status !== "assigned" || current.en_route_at || current.driver_accepted_at) return;

            const prevExcluded = Array.isArray(current._excluded_driver_ids) ? current._excluded_driver_ids : [];
            const excludedIds = uniqueIds([...prevExcluded, current.driver_id]);

            queryClient.setQueryData(["rides"], (old: Ride[] = []) =>
              old.map((r) => r.id === current.id ? { ...r, status: "pending", driver_id: null, driver_name: null, _excluded_driver_ids: excludedIds } : r)
            );

            await supabaseApi.drivers.update(String(current.driver_id), { status: "available" }).catch(() => {});
            queryClient.setQueryData(["drivers"], (old: Driver[] = []) =>
              old.map((d) => d.id === current.driver_id ? { ...d, status: "available" } : d)
            );

            await supabaseApi.rideRequests.update(current.id, {
              status: "pending",
              driver_id: null,
              driver_name: null,
              _excluded_driver_ids: excludedIds,
            });

            const useAuction = !!settingsRef.current?.auction_mode_enabled || current.assignment_mode === "auction";
            if (useAuction) {
              await startAuction({ ...current, status: "pending", driver_id: null, assignment_mode: "auction" }, excludedIds);
            } else {
              await autoAssignDriver({ ...current, status: "pending", driver_id: null }, excludedIds);
            }
          }, remaining);

          assignedRideTimersRef.current[ride.id] = timer;
        } else if (
          ride.driver_accepted_at ||
          ride.en_route_at ||
          ["completed", "cancelled", "en_route", "arrived", "in_progress", "admin_approved"].includes(ride.status || "")
        ) {
          if (assignedRideTimersRef.current[ride.id]) {
            clearTimeout(assignedRideTimersRef.current[ride.id]);
            delete assignedRideTimersRef.current[ride.id];
          }
        }

        if (ride.status === "auction" && ride.auction_expires_at) {
          const key = `${ride.id}_${ride.auction_expires_at}`;
          if (processedAuctionsRef.current.has(key)) continue;

          const expiresAt = new Date(ride.auction_expires_at).getTime();
          const remaining = Math.max(0, expiresAt - now);
          processedAuctionsRef.current.add(key);

          const timer = setTimeout(async () => {
            const current = await supabaseApi.rideRequests.get(ride.id).catch(() => null);
            if (!current || current.status !== "auction") return;

            const notifiedIds = Array.isArray(current.auction_driver_ids) ? current.auction_driver_ids : [];
            const prevExcluded = Array.isArray(current._excluded_driver_ids) ? current._excluded_driver_ids : [];
            const allExcluded = uniqueIds([...prevExcluded, ...notifiedIds]);

            queryClient.setQueryData(["rides"], (old: Ride[] = []) =>
              old.map((r) => r.id === current.id ? { ...r, status: "pending", auction_driver_ids: [], _excluded_driver_ids: allExcluded } : r)
            );

            await Promise.all(notifiedIds.map((driverId) => supabaseApi.drivers.update(driverId, { status: "available" }).catch(() => {})));
            queryClient.setQueryData(["drivers"], (old: Driver[] = []) =>
              old.map((d) => notifiedIds.includes(d.id) ? { ...d, status: "available" } : d)
            );

            await supabaseApi.rideRequests.update(current.id, {
              status: "pending",
              auction_driver_ids: [],
              _excluded_driver_ids: allExcluded,
              assignment_mode: "auction",
            });

            await startAuction({ ...current, status: "pending", driver_id: null, auction_driver_ids: [], assignment_mode: "auction" }, allExcluded);
          }, remaining);

          assignTimeoutsRef.current.push(timer);
        }
      }
    });

    return () => {
      unsub();
      Object.values(assignedRideTimersRef.current).forEach(clearTimeout);
      assignedRideTimersRef.current = {};
      assignTimeoutsRef.current.forEach(clearTimeout);
      assignTimeoutsRef.current = [];
    };
  }, [queryClient]);

  return null;
}