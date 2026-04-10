"use client"

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Loader2, MapPin } from "lucide-react"

// Fix default marker icon
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
  popupAnchor: [1, -34],
})

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

interface DraggableMarkerProps {
  position: [number, number]
  onMove: (lat: number, lng: number) => void
  icon: L.Icon
}

function DraggableMarker({ position, onMove, icon }: DraggableMarkerProps) {
  const markerRef = useRef<L.Marker>(null)

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      icon={icon}
      eventHandlers={{
        dragend: () => {
          const m = markerRef.current
          if (m) {
            const { lat, lng } = m.getLatLng()
            onMove(lat, lng)
          }
        },
      }}
    />
  )
}

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void
}

function MapClickHandler({ onClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface FlyToProps {
  lat: number
  lon: number
}

function FlyTo({ lat, lon }: FlyToProps) {
  const map = useMap()
  const prevRef = useRef<string | null>(null)

  useEffect(() => {
    const key = `${lat}-${lon}`
    if (key !== prevRef.current && lat && lon) {
      prevRef.current = key
      map.flyTo([lat, lon], Math.max(map.getZoom(), 15), { duration: 0.5 })
    }
  }, [lat, lon, map])

  return null
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "es" } }
    )
    const data = await res.json()
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

interface AdminMapPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lat?: number
  lon?: number
  label?: string
  isDropoff?: boolean
  onConfirm: (address: string, lat: number, lon: number) => void
}

export default function AdminMapPicker({
  open,
  onOpenChange,
  lat,
  lon,
  label,
  isDropoff = false,
  onConfirm,
}: AdminMapPickerProps) {
  const defaultLat = lat || 20.967
  const defaultLon = lon || -89.623
  const [pos, setPos] = useState<[number, number]>([
    defaultLat,
    defaultLon,
  ])
  const [address, setAddress] = useState("")
  const [geocoding, setGeocoding] = useState(false)
  const icon = isDropoff ? redIcon : greenIcon

  useEffect(() => {
    if (open) {
      setPos([lat || 20.967, lon || -89.623])
      setAddress("")
    }
  }, [open, lat, lon])

  const handleMove = useCallback(async (newLat: number, newLng: number) => {
    setPos([newLat, newLng])
    setGeocoding(true)
    const addr = await reverseGeocode(newLat, newLng)
    setAddress(addr)
    setGeocoding(false)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 pt-4 pb-2 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4 text-slate-500" />
            Ajustar {label || "ubicación"} en mapa
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-0.5">
            Arrastra el marcador o haz clic en el mapa para precisar
          </p>
        </DialogHeader>

        <div style={{ height: 380 }} className="relative">
          <MapContainer
            center={pos}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            <DraggableMarker position={pos} onMove={handleMove} icon={icon} />
            <MapClickHandler onClick={handleMove} />
            <FlyTo lat={pos[0]} lon={pos[1]} />
          </MapContainer>
          {geocoding && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full px-3 py-1.5 flex items-center gap-2 text-xs text-slate-600 shadow border border-slate-200">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />{" "}
              Obteniendo dirección...
            </div>
          )}
        </div>

        {address && (
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-600 line-clamp-2">
              📍 {address}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm(address, pos[0], pos[1])
              onOpenChange(false)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirmar ubicación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
