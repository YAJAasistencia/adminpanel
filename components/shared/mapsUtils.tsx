/**
 * Utilidades para cálculo de rutas usando Google Maps JS SDK o OSRM
 */

// ─── Google Maps JS SDK loader ───────────────────────────────────────────────
let _googleMapsLoading = null;

function loadGoogleMapsSDK(apiKey) {
  if (window.google?.maps?.DirectionsService) return Promise.resolve(true);
  if (_googleMapsLoading) return _googleMapsLoading;

  _googleMapsLoading = new Promise((resolve) => {
    // Check if already loading via an existing script tag
    const existing = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps?.DirectionsService) {
          clearInterval(check);
          resolve(true);
        }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(false); }, 10000);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => { _googleMapsLoading = null; resolve(false); };
    document.head.appendChild(script);
  });

  return _googleMapsLoading;
}

// ─── OSRM route (with full geometry) ─────────────────────────────────────────
export async function getOSRMRoute(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data.routes?.[0]) {
      const route = data.routes[0];
      // GeoJSON coords are [lon, lat] — convert to Leaflet [lat, lon]
      const polyline = (route.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon]);
      return {
        distKm: route.distance / 1000,
        durationMin: Math.ceil(route.duration / 60),
        polyline,
      };
    }
  } catch {}
  return null;
}

// ─── Google Maps JS SDK route (with traffic + geometry) ──────────────────────
export async function getGoogleMapsRoute(lat1, lon1, lat2, lon2, apiKey) {
  if (!lat1 || !lon1 || !lat2 || !lon2 || !apiKey) return null;
  try {
    const loaded = await loadGoogleMapsSDK(apiKey);
    if (!loaded || !window.google?.maps?.DirectionsService) return null;

    return await new Promise((resolve) => {
      const service = new window.google.maps.DirectionsService();
      service.route(
        {
          origin: { lat: lat1, lng: lon1 },
          destination: { lat: lat2, lng: lon2 },
          travelMode: window.google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: "bestguess",
          },
        },
        (result, status) => {
          if (status === "OK" && result?.routes?.[0]?.legs?.[0]) {
            const leg = result.routes[0].legs[0];
            // Use duration_in_traffic when available (requires traffic-aware API key)
            const durationSec = (leg.duration_in_traffic || leg.duration).value;
            // Decode overview polyline to [lat, lon] array for Leaflet
            const encoded = result.routes[0].overview_polyline?.points || "";
            const polyline = _decodePolyline(encoded);
            resolve({
              distKm: leg.distance.value / 1000,
              durationMin: Math.ceil(durationSec / 60),
              durationInTraffic: !!leg.duration_in_traffic,
              polyline,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch {}
  return null;
}

// ─── Polyline decoder (Google encoded format) ─────────────────────────────────
function _decodePolyline(encoded) {
  const result = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result_val = 0, b;
    do { b = encoded.charCodeAt(index++) - 63; result_val |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result_val & 1 ? ~(result_val >> 1) : result_val >> 1);
    shift = 0; result_val = 0;
    do { b = encoded.charCodeAt(index++) - 63; result_val |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result_val & 1 ? ~(result_val >> 1) : result_val >> 1);
    result.push([lat / 1e5, lng / 1e5]);
  }
  return result;
}

// ─── Provider orchestrator ───────────────────────────────────────────────────
export async function getRoute(lat1, lon1, lat2, lon2, provider = "osrm", apiKey = null) {
  if (provider === "google_maps" && apiKey) {
    const result = await getGoogleMapsRoute(lat1, lon1, lat2, lon2, apiKey);
    if (result) return result;
    // Fallback to OSRM if Google Maps fails
    return await getOSRMRoute(lat1, lon1, lat2, lon2);
  }
  return await getOSRMRoute(lat1, lon1, lat2, lon2);
}

// ─── Haversine distance ──────────────────────────────────────────────────────
export function getHaverDist(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
