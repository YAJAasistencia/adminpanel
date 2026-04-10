"use client"

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { base44 } from "@/lib/api/base44Client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Star,
  Car,
  AlertCircle,
  MapPin,
  Navigation,
  List,
  Map as MapIcon,
} from "lucide-react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  useMap,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix leaflet icons
;(L.Icon.Default.prototype as any)._getIconUrl = undefined
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
})

const goldIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [22, 36],
  iconAnchor: [11, 36],
})

// Types
interface Driver {
  id: string | number
  full_name: string
  latitude: number
  longitude: number
  status: string
  approval_status: string
  service_type_ids?: (string | number)[]
  service_type_names?: string[]
  city_id?: string | number
  rating?: number
  vehicle_brand?: string
  vehicle_model?: string
  license_plate?: string
}

interface Ride {
  id: string | number
  passenger_name: string
  pickup_address: string
  dropoff_address?: string
  pickup_lat: number
  pickup_lon: number
  service_type_id?: string | number
  service_type_name?: string
  city_id?: string | number
  city_name?: string
  driver_id?: string | number
  status: string
}

interface GeoZone {
  id: string | number
  name: string
  color?: string
  tipo_zona: "poligono" | "circulo"
  poligono?: Array<{ lat: number; lng?: number; lon?: number }>
  center_lat?: number
  center_lon?: number
  radius_km?: number
  tipo_tarifa: "fija" | "variable"
  tarifa_fija?: number
  tarifa_base?: number
  tarifa_por_km?: number
}

interface OSRMRoute {
  distKm: number
  durationMin: number
}

// Utils
function getHaverDist(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchOSRMRoutes(
  pickupLat: number,
  pickupLon: number,
  drivers: Driver[]
): Promise<Record<string | number, OSRMRoute>> {
  const results: Record<string | number, OSRMRoute> = {}
  await Promise.all(
    drivers.map(async (d) => {
      if (!d.latitude || !d.longitude) return
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${d.longitude},${d.latitude};${pickupLon},${pickupLat}?overview=false`
        const res = await fetch(url)
        const data = await res.json()
        if (data.routes?.[0]) {
          results[d.id] = {
            distKm: data.routes[0].distance / 1000,
            durationMin: Math.ceil(data.routes[0].duration / 60),
          }
        }
      } catch {}
    })
  )
  return results
}

interface FitMapProps {
  center: [number, number]
  primaryKm: number
  secondaryKm: number
}

function FitMap({ center, primaryKm, secondaryKm }: FitMapProps) {
  const map = useMap()
  const doneRef = useRef(false)

  useEffect(() => {
    if (!doneRef.current && center) {
      doneRef.current = true
      const radiusM = (secondaryKm || primaryKm || 5) * 1000
      const bounds = L.latLng(center).toBounds(radiusM * 2.2)
      map.fitBounds(bounds)
    }
  }, [center, map, primaryKm, secondaryKm])

  return null
}

interface AssignDriverDialogProps {
  ride: Ride
  drivers: Driver[]
  rides: Ride[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned?: (ride: Ride, driver: Driver) => void
}

export default function AssignDriverDialog({
  ride,
  drivers,
  rides,
  open,
  onOpenChange,
  onAssigned,
}: AssignDriverDialogProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | number>("")
  const [saving, setSaving] = useState(false)
  const [osrmRoutes, setOsrmRoutes] = useState<
    Record<string | number, OSRMRoute>
  >({})
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const queryClient = useQueryClient()

  // Load GeoZones
  const { data: geoZones = [] } = useQuery({
    queryKey: ["geoZones"],
    queryFn: () => base44.entities.GeoZone.list(),
    enabled: open,
    staleTime: 60000,
  })

  // Filter busy drivers
  const trulyBusyDriverIds = new Set(
    (rides || [])
      .filter(
        (r) =>
          ["en_route", "arrived", "in_progress", "admin_approved"].includes(
            r.status
          ) && r.driver_id
      )
      .map((r) => r.driver_id)
  )

  const availableDrivers = useMemo(() => {
    const base = drivers.filter((d) => {
      if (d.status !== "available") return false
      if (d.approval_status !== "approved") return false
      if (trulyBusyDriverIds.has(d.id)) return false

      const hasServiceTypes =
        (d.service_type_ids?.length ?? 0) > 0 ||
        (d.service_type_names?.length ?? 0) > 0
      if (hasServiceTypes) {
        const matchById =
          ride?.service_type_id &&
          d.service_type_ids?.includes(ride.service_type_id)
        const matchByName =
          ride?.service_type_name &&
          d.service_type_names?.includes(ride.service_type_name)
        if (ride?.service_type_id || ride?.service_type_name) {
          if (!matchById && !matchByName) return false
        }
      }

      if (ride?.city_id && d.city_id && d.city_id !== ride.city_id)
        return false
      return true
    })

    if (ride?.pickup_lat && ride?.pickup_lon) {
      return [...base].sort((a, b) => {
        const da = getHaverDist(
          ride.pickup_lat,
          ride.pickup_lon,
          a.latitude,
          a.longitude
        )
        const db = getHaverDist(
          ride.pickup_lat,
          ride.pickup_lon,
          b.latitude,
          b.longitude
        )
        return da - db
      })
    }

    return base
  }, [drivers, rides, ride, trulyBusyDriverIds])

  // Auto-select nearest
  useEffect(() => {
    if (availableDrivers.length > 0 && !selectedDriverId) {
      setSelectedDriverId(availableDrivers[0].id)
    }
  }, [availableDrivers, selectedDriverId])

  // Reset when opened
  useEffect(() => {
    if (open) {
      setOsrmRoutes({})
      setSelectedDriverId("")
      const hasPickupCoords = !!(ride?.pickup_lat && ride?.pickup_lon)
      setViewMode(hasPickupCoords ? "map" : "list")
    }
  }, [open, ride?.id])

  // Fetch OSRM routes
  useEffect(() => {
    if (
      !open ||
      !ride?.pickup_lat ||
      !ride?.pickup_lon ||
      availableDrivers.length === 0
    )
      return

    setLoadingRoutes(true)
    fetchOSRMRoutes(ride.pickup_lat, ride.pickup_lon, availableDrivers).then(
      (routes) => {
        setOsrmRoutes(routes)
        setLoadingRoutes(false)
      }
    )
  }, [open, ride?.pickup_lat, ride?.pickup_lon, availableDrivers.length])

  const handleAssign = async () => {
    if (!selectedDriverId) return
    setSaving(true)
    const driver = drivers.find((d) => d.id === selectedDriverId)
    if (!driver) {
      setSaving(false)
      return
    }

    const previousDriverId = ride?.driver_id
    if (previousDriverId && previousDriverId !== selectedDriverId) {
      await base44.entities.Driver.update(previousDriverId, {
        status: "available",
      })
    }

    const updatedRide = {
      driver_id: selectedDriverId,
      driver_name: driver.full_name,
      status: "assigned",
      _excluded_driver_ids: [],
      auction_driver_ids: [],
    }

    await base44.entities.RideRequest.update(ride.id, updatedRide)
    await base44.entities.Driver.update(selectedDriverId, { status: "busy" })
    queryClient.invalidateQueries({ queryKey: ["rides"] })
    queryClient.invalidateQueries({ queryKey: ["drivers"] })
    setSaving(false)

    if (onAssigned) {
      onAssigned({ ...ride, ...updatedRide }, driver)
    }
    onOpenChange(false)
    setSelectedDriverId("")
  }

  const nearest = availableDrivers[0]
  const hasPickup = !!(ride?.pickup_lat && ride?.pickup_lon)
  const primaryRadius = 5
  const secondaryRadius = 15

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            Asignar conductor
            <span className="text-sm font-normal text-slate-400">
              — {availableDrivers.length} disponible
              {availableDrivers.length !== 1 ? "s" : ""}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Ride info */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-sm font-semibold text-slate-900">
              {ride?.passenger_name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {ride?.pickup_address}
              {ride?.dropoff_address
                ? ` → ${ride.dropoff_address}`
                : " (destino no definido)"}
            </p>
            {ride?.service_type_name && (
              <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 mt-1 inline-block">
                {ride.service_type_name}
              </span>
            )}
          </div>

          {/* Nearest driver info */}
          {nearest && hasPickup && (
            <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-700 border border-blue-100">
              <Navigation className="w-4 h-4 flex-shrink-0" />
              {osrmRoutes[nearest.id] ? (
                <span>
                  Más cercano: <strong>{nearest.full_name}</strong> ·{" "}
                  {osrmRoutes[nearest.id].distKm.toFixed(1)} km por ruta ·
                  ~{osrmRoutes[nearest.id].durationMin} min
                </span>
              ) : (
                <span>
                  Más cercano: <strong>{nearest.full_name}</strong> ·{" "}
                  {getHaverDist(
                    ride.pickup_lat,
                    ride.pickup_lon,
                    nearest.latitude,
                    nearest.longitude
                  ).toFixed(1)}{" "}
                  km {loadingRoutes ? "(calculando...)" : ""}
                </span>
              )}
            </div>
          )}

          {/* Toggle list/map */}
          {hasPickup && (
            <div className="flex rounded-xl overflow-hidden border border-slate-200">
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <List className="w-3.5 h-3.5" /> Lista
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                  viewMode === "map"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" /> Mapa con radios
              </button>
            </div>
          )}

          {/* MAP VIEW */}
          {viewMode === "map" && hasPickup && (
            <div
              style={{ height: 340 }}
              className="rounded-xl overflow-hidden border border-slate-200"
            >
              <MapContainer
                center={[ride.pickup_lat, ride.pickup_lon]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />
                <FitMap
                  center={[ride.pickup_lat, ride.pickup_lon]}
                  primaryKm={primaryRadius}
                  secondaryKm={secondaryRadius}
                />

                {/* Radius circles */}
                <Circle
                  center={[ride.pickup_lat, ride.pickup_lon]}
                  radius={primaryRadius * 1000}
                  pathOptions={{
                    color: "#3B82F6",
                    fillColor: "#3B82F6",
                    fillOpacity: 0.05,
                    weight: 2,
                    dashArray: "6 4",
                  }}
                />
                <Circle
                  center={[ride.pickup_lat, ride.pickup_lon]}
                  radius={secondaryRadius * 1000}
                  pathOptions={{
                    color: "#F59E0B",
                    fillColor: "#F59E0B",
                    fillOpacity: 0.03,
                    weight: 1.5,
                    dashArray: "4 4",
                  }}
                />

                {/* GeoZone polygons */}
                {geoZones.map((zone: GeoZone) => {
                  const color = zone.color || "#10B981"
                  if (
                    zone.tipo_zona === "poligono" &&
                    Array.isArray(zone.poligono) &&
                    zone.poligono.length >= 3
                  ) {
                    const positions = zone.poligono.map((p) => [
                      p.lat,
                      p.lng || p.lon,
                    ]) as [number, number][]
                    return (
                      <Polygon
                        key={zone.id}
                        positions={positions}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: 0.12,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <div className="text-xs min-w-[120px]">
                            <p className="font-bold">{zone.name}</p>
                            {zone.tipo_tarifa === "fija" ? (
                              <p>Tarifa fija: ${zone.tarifa_fija}</p>
                            ) : (
                              <p>
                                Base ${zone.tarifa_base} + $
                                {zone.tarifa_por_km}/km
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Polygon>
                    )
                  }
                  if (
                    zone.center_lat &&
                    zone.center_lon &&
                    zone.radius_km
                  ) {
                    return (
                      <Circle
                        key={zone.id}
                        center={[zone.center_lat, zone.center_lon]}
                        radius={zone.radius_km * 1000}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: 0.12,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <div className="text-xs min-w-[120px]">
                            <p className="font-bold">{zone.name}</p>
                            {zone.tipo_tarifa === "fija" ? (
                              <p>Tarifa fija: ${zone.tarifa_fija}</p>
                            ) : (
                              <p>
                                Base ${zone.tarifa_base} + $
                                {zone.tarifa_por_km}/km
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Circle>
                    )
                  }
                  return null
                })}

                {/* Pickup marker */}
                <Marker
                  position={[ride.pickup_lat, ride.pickup_lon]}
                  icon={greenIcon}
                >
                  <Popup>
                    <strong>📍 Recogida</strong>
                    <br />
                    {ride.pickup_address}
                  </Popup>
                </Marker>

                {/* Driver markers */}
                {availableDrivers.map((d, i) => {
                  if (!d.latitude || !d.longitude) return null
                  const isSelected = selectedDriverId === d.id
                  const route = osrmRoutes[d.id]
                  const dist = getHaverDist(
                    ride.pickup_lat,
                    ride.pickup_lon,
                    d.latitude,
                    d.longitude
                  )
                  return (
                    <Marker
                      key={d.id}
                      position={[d.latitude, d.longitude]}
                      icon={isSelected ? goldIcon : blueIcon}
                      eventHandlers={{
                        click: () => setSelectedDriverId(d.id),
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1 min-w-[140px]">
                          <p className="font-bold">{d.full_name}</p>
                          <p>
                            <Star className="w-3 h-3 inline text-amber-400" />{" "}
                            {d.rating || 5}
                          </p>
                          <p>
                            {d.vehicle_brand} {d.vehicle_model} ·{" "}
                            {d.license_plate}
                          </p>
                          {route ? (
                            <p>
                              🛣 {route.distKm.toFixed(1)} km · {route.durationMin}{" "}
                              min
                            </p>
                          ) : (
                            <p>
                              📐 {dist.toFixed(1)} km (en línea)
                            </p>
                          )}
                          <button
                            onClick={() => setSelectedDriverId(d.id)}
                            className={`mt-1 w-full text-xs py-1 rounded font-semibold ${
                              isSelected
                                ? "bg-emerald-500 text-white"
                                : "bg-blue-500 text-white"
                            }`}
                          >
                            {isSelected ? "✓ Seleccionado" : "Seleccionar"}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            </div>
          )}

          {/* Map legend */}
          {viewMode === "map" && hasPickup && (
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 border-t-2 border-blue-400 border-dashed" />{" "}
                Radio {primaryRadius} km (primario)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 border-t-2 border-amber-400 border-dashed" />{" "}
                Radio {secondaryRadius} km (secundario)
              </span>
              <span className="flex items-center gap-1">
                <span className="text-amber-500">★</span> Seleccionado
              </span>
              {geoZones.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-emerald-400 opacity-60" />{" "}
                  Geocercas ({geoZones.length})
                </span>
              )}
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === "list" && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Conductores disponibles
              </label>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {availableDrivers.length === 0 && (
                  <div className="p-4 text-sm text-slate-500 text-center flex flex-col items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-slate-300" />
                    <span>No hay conductores disponibles</span>
                    <span className="text-xs text-slate-400">
                      {ride?.service_type_name
                        ? `Requiere: "${ride.service_type_name}". `
                        : ""}
                      {ride?.city_name ? `Ciudad: "${ride.city_name}".` : ""}
                    </span>
                  </div>
                )}
                {availableDrivers.map((driver, index) => {
                  const haverDist = hasPickup
                    ? getHaverDist(
                        ride.pickup_lat,
                        ride.pickup_lon,
                        driver.latitude,
                        driver.longitude
                      )
                    : null
                  const route = osrmRoutes[driver.id]
                  const isSelected = selectedDriverId === driver.id
                  return (
                    <button
                      key={driver.id}
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          {index === 0 && hasPickup && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                              Más cercano
                            </span>
                          )}
                          <span className="text-sm font-semibold text-slate-800">
                            {driver.full_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {driver.rating || 5}
                          </span>
                          {route ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <MapPin className="w-3 h-3" />
                              {route.distKm.toFixed(1)} km · {route.durationMin}{" "}
                              min
                            </span>
                          ) : haverDist !== null && haverDist !== Infinity ? (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <MapPin className="w-3 h-3" />
                              {haverDist.toFixed(1)} km{loadingRoutes ? " …" : ""}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <Car className="w-3 h-3 inline mr-0.5" />
                        {driver.vehicle_brand} {driver.vehicle_model} ·{" "}
                        {driver.license_plate}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selected driver ETA confirmation */}
          {selectedDriverId &&
            (() => {
              const sel = drivers.find((d) => d.id === selectedDriverId)
              const route = osrmRoutes[selectedDriverId]
              const haverDist =
                sel && hasPickup
                  ? getHaverDist(
                      ride.pickup_lat,
                      ride.pickup_lon,
                      sel.latitude,
                      sel.longitude
                    )
                  : null
              return (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-800 font-semibold">
                      ✓ Seleccionado:{" "}
                      <strong>{sel?.full_name}</strong>
                    </span>
                    {route ? (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-600">
                          🛣 {route.distKm.toFixed(1)} km
                        </span>
                        <span className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg">
                          ⏱ ~{route.durationMin} min
                        </span>
                      </div>
                    ) : haverDist && haverDist !== Infinity ? (
                      <span className="text-xs text-slate-500">
                        ≈ {haverDist.toFixed(1)} km (línea recta)
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedDriverId || saving}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {saving ? "Asignando..." : "Asignar conductor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
