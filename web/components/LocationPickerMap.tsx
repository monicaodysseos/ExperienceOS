"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";

interface LocationValue {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerMapProps {
  value?: LocationValue;
  onChange: (value: LocationValue | null) => void;
  addressValue?: string;
  onAddressChange?: (address: string) => void;
}

// Inner map rendered only on client — loaded lazily to avoid SSR issues with Leaflet
function LeafletPicker({
  value,
  onChange,
}: {
  value?: LocationValue;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      // Fix default icon path issues in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const customIcon = new L.Icon({
        iconUrl: "data:image/svg+xml;base64," + btoa(`
          <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="#0f766e"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        `),
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });

      const initialCenter: [number, number] = value
        ? [value.lat, value.lng]
        : [35.1264, 33.4299]; // Cyprus

      const map = L.map(containerRef.current!, {
        center: initialCenter,
        zoom: value ? 14 : 9,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
        attribution: "&copy; CartoDB",
      }).addTo(map);

      if (value) {
        markerRef.current = L.marker([value.lat, value.lng], { icon: customIcon }).addTo(map);
      }

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        }

        onChange(lat, lng);
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker if value changes externally (e.g. cleared)
  useEffect(() => {
    if (!mapRef.current) return;
    if (!value && markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [value]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export function LocationPickerMap({
  value,
  onChange,
  addressValue = "",
  onAddressChange,
}: LocationPickerMapProps) {
  const [showMap, setShowMap] = useState(!!value?.lat);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    onChange({
      lat,
      lng,
      address: addressValue,
    });
  };

  const handleClear = () => {
    onChange(null);
    setShowMap(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-navy-700">Meeting point</label>

      {/* Address text field */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Address or landmark"
          value={addressValue}
          onChange={(e) => {
            onAddressChange?.(e.target.value);
            if (value) {
              onChange({ ...value, address: e.target.value });
            }
          }}
          className="flex-1 rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
        {!showMap && (
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-600 hover:bg-navy-50 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Pin
          </button>
        )}
        {value?.lat && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Coordinate badge */}
      {value?.lat && (
        <p className="text-xs text-navy-500">
          Pin: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}

      {/* Map */}
      {showMap && isMounted && (
        <div className="relative overflow-hidden rounded-xl border border-navy-200" style={{ height: 280 }}>
          <LeafletPicker value={value} onChange={handleMapClick} />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs text-navy-600 shadow-sm pointer-events-none">
            Click anywhere on the map to place a pin
          </div>
        </div>
      )}
    </div>
  );
}
