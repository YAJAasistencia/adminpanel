/**
 * useRideAutoAssign
 *
 * Lógica global de auto-asignación de conductores.
 * Se monta en el Layout para que funcione en CUALQUIER página del panel,
 * no sólo cuando el Dashboard está abierto.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

function getHaverDist(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function useRideAutoAssign(settings, cities) {
  const queryClient = useQueryClient();

  // Always-fresh refs so closures don't stale
  const ridesRef = useRef([]);
  const driversRef = useRef([]);
  const settingsRef = useRef(settings);
  const citiesRef = useRef(cities);
  const assignTimeoutsRef = useRef([]);

  // Keep refs in sync
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { citiesRef.current = cities ?? []; }, [cities]);

  // Sync rides + drivers from React Query cache into refs
  useEffect(() => {
    ridesRef.current = queryClient.getQueryData(["rides"]) ?? [];
    driversRef.current = queryClient.getQueryData(["drivers"]) ?? [];

    if (ridesRef.current.length === 0) {
      base44.entities.RideRequest.list("-created_date", 100).then(data => {
        if (data?.length) {
          ridesRef.current = data;
          queryClient.setQueryData(["rides"], data);
        }
      });
    }
    if (driversRef.current.length === 0) {
      base44.entities.Driver.list().then(data => {
        if (data?.length) {
          driversRef.current = data;
          queryClient.setQueryData(["drivers"], data);
        }
      });
    }

    const unsub1 = queryClient.getQueryCache().subscribe(() => {
      const r = queryClient.getQueryData(["rides"]);
      if (r) ridesRef.current = r;
      const d = queryClient.getQueryData(["drivers"]);
      if (d) driversRef.current = d;
    });
    return unsub1;
  }, [queryClient]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getAvailableCandidates = (ride, allDrivers, allRides, radiusKm = null) => {
    const s = settingsRef.current;
    const localCities = citiesRef.current;
    // Only exclude drivers who have ACCEPTED a ride (en_route/arrived/in_progress/admin_approved)
    // Drivers with status "assigned" but not yet accepted are still available (driver.status is still "available")
    const busyRideDriverIds = new Set(
      allRides
        .filter(r => ["en_route", "arrived", "in_progress", "admin_approved"].includes(r.status) && r.driver_id)
        .map(r => r.driver_id)
    );
    return allDrivers.filter(d => {
      if (d.status !== "available") return false;
      if (d.approval_status !== "approved") return false;
      if (busyRideDriverIds.has(d.id)) return false;
      if (ride.service_type_name) {
        if (!d.service_type_names?.includes(ride.service_type_name)) return false;
      } else if (ride.service_type_id) {
        if (!d.service_type_ids?.includes(ride.service_type_id)) return false;
      }
      if (ride.city_id && d.city_id && d.city_id !== ride.city_id) return false;
      if (ride.pickup_lat && ride.pickup_lon) {
        const driverCity = localCities.find(c => c.id === d.city_id);
        if (driverCity?.center_lat && driverCity?.geofence_radius_km) {
          const dist = getHaverDist(ride.pickup_lat, ride.pickup_lon, driverCity.center_lat, driverCity.center_lon);
          if (dist > driverCity.geofence_radius_km) return false;
        }
        if (radiusKm !== null && d.latitude && d.longitude) {
          const distToRide = getHaverDist(ride.pickup_lat, ride.pickup_lon, d.latitude, d.longitude);
          if (distToRide > radiusKm) return false;
        }
      }
      return true;
    });
  };

  const fetchFreshDrivers = async () => {
    const freshDrivers = await base44.entities.Driver.list();
    driversRef.current = freshDrivers;
    queryClient.setQueryData(["drivers"], freshDrivers);
    return freshDrivers;
  };

  const autoAssignDriver = async (ride, excludeDriverIds = []) => {
    const s = settingsRef.current;
    const allRides = ridesRef.current;
    const primaryRadius = s?.auction_primary_radius_km ?? 5;
    const secondaryRadius = s?.auction_secondary_radius_km ?? 15;

    const allDrivers = await fetchFreshDrivers();

    let candidates = getAvailableCandidates(ride, allDrivers, allRides, primaryRadius)
      .filter(d => !excludeDriverIds.includes(d.id));
    if (candidates.length === 0)
      candidates = getAvailableCandidates(ride, allDrivers, allRides, secondaryRadius)
        .filter(d => !excludeDriverIds.includes(d.id));
    if (candidates.length === 0)
      candidates = getAvailableCandidates(ride, allDrivers, allRides, null)
        .filter(d => !excludeDriverIds.includes(d.id));
    if (candidates.length === 0) {
      // Asignación automática: esperar al menos 45s antes de marcar no_drivers (dar tiempo a conductores)
      const rideAge = Date.now() - new Date(ride.created_date || 0).getTime();
      const minWaitBeforeNoDrivers = 45 * 1000; // 45 segundos
      if (ride.assignment_mode !== "manual" && rideAge > minWaitBeforeNoDrivers) {
        await base44.entities.RideRequest.update(ride.id, {
          status: "no_drivers",
          cancellation_reason: "Sin conductores disponibles",
        });
        queryClient.setQueryData(["rides"], (old = []) =>
          old.map(r => r.id === ride.id ? { ...r, status: "no_drivers", cancellation_reason: "Sin conductores disponibles" } : r)
        );
      }
      return;
    }

    let sorted = candidates;
    if (ride.pickup_lat && ride.pickup_lon) {
      sorted = [...candidates].sort((a, b) =>
        getHaverDist(ride.pickup_lat, ride.pickup_lon, a.latitude, a.longitude) -
        getHaverDist(ride.pickup_lat, ride.pickup_lon, b.latitude, b.longitude)
      );
    }
    const best = sorted[0];
    const assignedNow = new Date().toISOString();
    queryClient.setQueryData(["lastAssignedDriver"], best);
    // Update cache IMMEDIATELY with current timestamp so the timer uses the right remaining time
    queryClient.setQueryData(["rides"], (old = []) =>
      old.map(r => r.id === ride.id ? { ...r, driver_id: best.id, driver_name: best.full_name, status: "assigned", updated_date: assignedNow } : r)
    );
    // NOTE: Do NOT mark driver as "busy" here — driver becomes busy only when they ACCEPT the ride.
    // Marking busy here would make the driver invisible to new searches even if they haven't responded yet.
    await base44.entities.RideRequest.update(ride.id, { driver_id: best.id, driver_name: best.full_name, status: "assigned" });
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
  };

  const startAuction = async (ride, excludeDriverIds = []) => {
    const s = settingsRef.current;
    const allRides = ridesRef.current;
    const primaryRadius = s?.auction_primary_radius_km ?? 5;
    const secondaryRadius = s?.auction_secondary_radius_km ?? 15;
    const maxDrivers = s?.auction_max_drivers ?? 5;
    // isSecondRound: ya se notificó a conductores antes (primera ronda terminó sin aceptación)
    const isSecondRound = excludeDriverIds.length > 0;

    const allDrivers = await fetchFreshDrivers();

    let candidates = [];
    if (!isSecondRound) {
      // Ronda 1: intentar radio primario primero
      candidates = getAvailableCandidates(ride, allDrivers, allRides, primaryRadius)
        .filter(d => !excludeDriverIds.includes(d.id));
      // Si no hay en radio primario, expandir INMEDIATAMENTE al secundario
      if (candidates.length === 0) {
        candidates = getAvailableCandidates(ride, allDrivers, allRides, secondaryRadius)
          .filter(d => !excludeDriverIds.includes(d.id));
      }
    } else {
      // Ronda 2: solo radio secundario (ya se intentó primario en ronda 1)
      candidates = getAvailableCandidates(ride, allDrivers, allRides, secondaryRadius)
        .filter(d => !excludeDriverIds.includes(d.id));
    }

    // Sin candidatos tras las búsquedas → pasar a asignación manual INMEDIATAMENTE
    if (candidates.length === 0) {
      if (ride.assignment_mode !== "manual") {
        const now = new Date().toISOString();
        await base44.entities.RideRequest.update(ride.id, {
          status: "pending",
          assignment_mode: "manual",
          manual_assignment_requested_at: now,
          driver_id: null,
          auction_driver_ids: [],
        });
        queryClient.setQueryData(["rides"], (old = []) =>
          old.map(r => r.id === ride.id ? {
            ...r, status: "pending", assignment_mode: "manual",
            manual_assignment_requested_at: now, driver_id: null, auction_driver_ids: []
          } : r)
        );
      }
      return;
    }

    let sorted = candidates;
    if (ride.pickup_lat && ride.pickup_lon) {
      sorted = [...candidates].sort((a, b) =>
        getHaverDist(ride.pickup_lat, ride.pickup_lon, a.latitude, a.longitude) -
        getHaverDist(ride.pickup_lat, ride.pickup_lon, b.latitude, b.longitude)
      );
    }
    const notifyDrivers = sorted.slice(0, maxDrivers);
    const auctionExpiresAt = new Date(Date.now() + (s?.auction_timeout_seconds ?? 30) * 1000).toISOString();
    // NOTE: Drivers are NOT marked busy here — they only become busy when they ACCEPT the auction ride.
    await base44.entities.RideRequest.update(ride.id, {
      auction_driver_ids: notifyDrivers.map(d => d.id),
      auction_expires_at: auctionExpiresAt,
      status: "auction",
    });
    queryClient.invalidateQueries({ queryKey: ["rides"] });
  };

  // ─── Real-time subscription: new rides & rejections ──────────────────────────
  useEffect(() => {
    const unsub = base44.entities.RideRequest.subscribe(async (event) => {
      queryClient.setQueryData(["rides"], (old = []) => {
        if (event.type === "delete") return old.filter(r => r.id !== event.id);
        if (event.type === "create") return [event.data, ...old];
        if (event.type === "update") return old.map(r => r.id === event.data?.id ? { ...r, ...event.data } : r);
        return old;
      });

      if (event.type === "create") {
        if (event.data?.status === "scheduled") return;

        if (event.data?.status === "pending" && event.data?.assignment_mode !== "manual") {
          const rideSnapshot = event.data;
          if (rideSnapshot.awaiting_payment_confirmation) return;

          const searchDelaySec = settingsRef.current?.search_phase_seconds ?? 5;
          // Mark ride as processing so the rescue polling doesn't also process it
          const createdRideId = rideSnapshot.id;
          setTimeout(async () => {
            // Re-fetch to make sure ride is still unassigned before acting
            const fresh = await base44.entities.RideRequest.filter({ id: createdRideId });
            const current = fresh?.[0];
            if (!current) return;
            // If ride already has a driver or is no longer pending/auction — skip
            if (current.driver_id || !["pending", "auction"].includes(current.status)) return;
            const s = settingsRef.current;
            const globalAuction = s?.auction_mode_enabled;
            if (globalAuction || current.assignment_mode === "auction") {
              startAuction(current);
            } else {
              autoAssignDriver(current);
            }
          }, searchDelaySec * 1000);
        }
      }

      if (event.type === "update") {
        const d = event.data;
        const wasReassignment = Array.isArray(d._excluded_driver_ids) && d._excluded_driver_ids.length > 0;
        if (d?.status === "pending" && !d?.driver_id && wasReassignment) {
          const excludeIds = d._excluded_driver_ids;
          if (d.assignment_mode === "auto" || !d.assignment_mode) {
            autoAssignDriver(d, excludeIds);
          } else if (d.assignment_mode === "auction") {
            const prevNotified = Array.isArray(d.auction_driver_ids) ? d.auction_driver_ids : [];
            startAuction(d, prevNotified);
          }
        }
      }
    });
    return unsub;
  }, [queryClient]);

  // ─── Interval: scheduled rides + rescue polling for unassigned pending rides ─
  useEffect(() => {
    const processingRideIds = new Set();

    const checkScheduledAndPending = async () => {
      const now = Date.now();
      const freshRides = await base44.entities.RideRequest.list("-created_date", 100);
      if (freshRides?.length) {
        ridesRef.current = freshRides;
        queryClient.setQueryData(["rides"], (old = []) => {
          const freshIds = new Set(freshRides.map(r => r.id));
          const recentLocal = (old || []).filter(r => !freshIds.has(r.id) && (now - new Date(r.created_date).getTime() < 5000));
          return [...recentLocal, ...freshRides];
        });
      }
      const rides = ridesRef.current;

      // ── 1. Scheduled rides ──────────────────────────────────────────────────
      const scheduledPending = rides.filter(r => r.status === "scheduled" && r.scheduled_time && !r.driver_id);
      for (const ride of scheduledPending) {
        const serviceTypes = queryClient.getQueryData(["serviceTypes"]) ?? [];
        const svcType = serviceTypes.find(s => s.name === ride.service_type_name);
        const advanceMinutes = svcType?.advance_assignment_minutes ?? 15;
        const assignAt = new Date(ride.scheduled_time).getTime() - advanceMinutes * 60 * 1000;
        if (now >= assignAt) {
          if (ride.assignment_mode === "auto" || !ride.assignment_mode) {
            await autoAssignDriver(ride);
          } else if (ride.assignment_mode === "auction") {
            await startAuction(ride);
          } else if (ride.assignment_mode === "manual") {
            await base44.entities.RideRequest.update(ride.id, { status: "pending" });
            queryClient.invalidateQueries({ queryKey: ["rides"] });
          }
        }
      }

      // ── 2. RESCUE: pending rides without driver ──────────────────────────────
      const s = settingsRef.current;
      const searchDelaySec = s?.search_phase_seconds ?? 5;
      const rescueRides = rides.filter(r =>
        (r.status === "pending" || r.status === "auction") &&
        !r.driver_id &&
        r.assignment_mode !== "manual" &&
        !r.scheduled_time &&
        !r.awaiting_payment_confirmation &&
        r.payment_status !== "awaiting_payment" &&
        (now - new Date(r.created_date).getTime()) > searchDelaySec * 1000 &&
        !processingRideIds.has(r.id)
      );

      for (const ride of rescueRides) {
        // If ride is currently in auction and not yet expired, skip — let the auction timer handle it
        if (ride.status === "auction" && ride.auction_expires_at) {
          const expiresAt = new Date(ride.auction_expires_at).getTime();
          if (now < expiresAt) continue; // auction still active, don't interfere
        }

        processingRideIds.add(ride.id);
        const fresh = await base44.entities.RideRequest.filter({ id: ride.id });
        const current = fresh?.[0];
        if (!current) { processingRideIds.delete(ride.id); continue; }
        if (current.driver_id || !["pending", "auction"].includes(current.status)) {
          processingRideIds.delete(ride.id);
          continue;
        }

        // Double-check: if still in auction and not expired, skip
        if (current.status === "auction" && current.auction_expires_at) {
          const expiresAt = new Date(current.auction_expires_at).getTime();
          if (now < expiresAt) { processingRideIds.delete(ride.id); continue; }
        }

        const excludeIds = Array.isArray(current._excluded_driver_ids) ? current._excluded_driver_ids : [];
        const useAuction = s?.auction_mode_enabled || current.assignment_mode === "auction";
        if (useAuction) {
          const prevNotified = Array.isArray(current.auction_driver_ids) ? current.auction_driver_ids : [];
          await startAuction(current, [...new Set([...excludeIds, ...prevNotified])]);
        } else {
          await autoAssignDriver(current, excludeIds);
        }
        // Retry every 20s if no driver found
        setTimeout(() => processingRideIds.delete(ride.id), 20000);
      }
    };

    const id = setInterval(checkScheduledAndPending, 10000);
    checkScheduledAndPending();
    return () => clearInterval(id);
  }, [queryClient]);

  // ─── Per-ride assignment timeout tracking ────────────────────────────────────
  const assignedRideTimersRef = useRef({});
  const processedAuctionsRef = useRef(new Set());

  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe(() => {
      const rides = queryClient.getQueryData(["rides"]) ?? [];
      const s = settingsRef.current;
      const timeoutMs = (s?.auction_timeout_seconds ?? 30) * 1000;
      const now = Date.now();

      for (const ride of rides) {
        // Only apply acceptance timeout to rides that:
        // - Are "assigned" status
        // - Have a driver
        // - Driver has NOT yet accepted (no driver_accepted_at)
        // - Are not manual assignments (manual assignments don't have an acceptance timeout)
        // - Are not en_route yet
        if (ride.status === "assigned" && ride.driver_id && !ride.en_route_at && !ride.driver_accepted_at && ride.assignment_mode !== "manual") {
          if (assignedRideTimersRef.current[ride.id]) continue;
          const assignedAt = new Date(ride.updated_date || ride.created_date).getTime();
          // For auction rides: the driver sets driver_accepted_at immediately on accept,
          // but there's a brief race window. Add a 3s grace period for auction rides to
          // allow driver_accepted_at to arrive before we consider triggering a timeout.
          const graceMs = ride.assignment_mode === "auction" ? 3000 : 0;
          const remaining = Math.max(0, timeoutMs + graceMs - (now - assignedAt));
          const t = setTimeout(async () => {
            delete assignedRideTimersRef.current[ride.id];
            const fresh = await base44.entities.RideRequest.filter({ id: ride.id });
            const current = fresh?.[0];
            // CRITICAL: Stop if ride already accepted, en_route, or no longer assigned
            if (!current || current.status !== "assigned" || current.en_route_at || current.driver_accepted_at) return;
            const prevExcluded = Array.isArray(current._excluded_driver_ids) ? current._excluded_driver_ids : [];
            const excludedIds = [...new Set([...prevExcluded, current.driver_id])];
            // Update cache to "pending" IMMEDIATELY before any async calls so the
            // cache subscriber won't see the ride as "assigned" and create a zero-remaining timer
            queryClient.setQueryData(["rides"], (old = []) =>
              old.map(r => r.id === current.id ? { ...r, status: "pending", driver_id: null, driver_name: null, _excluded_driver_ids: excludedIds } : r)
            );
            // Make sure driver goes back to available — they haven't accepted the ride
            await base44.entities.Driver.update(current.driver_id, { status: "available" });
            queryClient.setQueryData(["drivers"], (old = []) =>
              old.map(d => d.id === current.driver_id ? { ...d, status: "available" } : d)
            );
            await base44.entities.RideRequest.update(current.id, {
              status: "pending", driver_id: null, driver_name: null,
              _excluded_driver_ids: excludedIds,
            });
            // Determine assignment mode for re-try
            const s = settingsRef.current;
            const useAuction = s?.auction_mode_enabled || current.assignment_mode === "auction";
            if (useAuction) {
              startAuction({ ...current, status: "pending", driver_id: null, assignment_mode: "auction" }, excludedIds);
            } else {
              autoAssignDriver({ ...current, status: "pending", driver_id: null }, excludedIds);
            }
          }, remaining);
          assignedRideTimersRef.current[ride.id] = t;
        } else if (
          // Clear timer if ride was accepted, went en_route, or reached a terminal state
          ride.driver_accepted_at ||
          ["completed", "cancelled", "en_route", "arrived", "in_progress", "admin_approved"].includes(ride.status)
        ) {
          if (assignedRideTimersRef.current[ride.id]) {
            clearTimeout(assignedRideTimersRef.current[ride.id]);
            delete assignedRideTimersRef.current[ride.id];
          }
        }

        if (ride.status === "auction" && ride.auction_expires_at) {
          const key = ride.id + "_" + ride.auction_expires_at;
          if (processedAuctionsRef.current.has(key)) continue;
          const expiresAt = new Date(ride.auction_expires_at).getTime();
          const remaining = Math.max(0, expiresAt - now);
          processedAuctionsRef.current.add(key);
          const t = setTimeout(async () => {
            const fresh = await base44.entities.RideRequest.filter({ id: ride.id });
            const current = fresh?.[0];
            // If already assigned or taken — don't interfere
            if (!current || current.status !== "auction") return;
            const notifiedIds = Array.isArray(current.auction_driver_ids) ? current.auction_driver_ids : [];
            const prevExcluded = Array.isArray(current._excluded_driver_ids) ? current._excluded_driver_ids : [];
            const allExcluded = [...new Set([...prevExcluded, ...notifiedIds])];
            // Update cache to "pending" IMMEDIATELY to prevent stale "auction" triggering new timers
            queryClient.setQueryData(["rides"], (old = []) =>
              old.map(r => r.id === current.id ? { ...r, status: "pending", auction_driver_ids: [], _excluded_driver_ids: allExcluded } : r)
            );
            // Make sure all notified drivers are still available (they didn't accept)
            await Promise.all(notifiedIds.map(dId =>
              base44.entities.Driver.update(dId, { status: "available" }).catch(() => {})
            ));
            queryClient.setQueryData(["drivers"], (old = []) =>
              old.map(d => notifiedIds.includes(d.id) ? { ...d, status: "available" } : d)
            );
            await base44.entities.RideRequest.update(current.id, {
              status: "pending", auction_driver_ids: [],
              _excluded_driver_ids: allExcluded,
              assignment_mode: "auction",
            });
            startAuction({ ...current, status: "pending", driver_id: null, auction_driver_ids: [], assignment_mode: "auction" }, allExcluded);
          }, remaining);
          assignTimeoutsRef.current.push(t);
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
}
