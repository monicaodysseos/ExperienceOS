"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, X, Search, Loader2 } from "lucide-react";

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

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
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
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="#1a1a2e"/>
            <circle cx="16" cy="16" r="6" fill="#facc15"/>
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

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
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

  // Update marker if value changes externally (e.g. cleared or geocoded)
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      const customIcon = new L.Icon({
        iconUrl: "data:image/svg+xml;base64," + btoa(`
          <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="#1a1a2e"/>
            <circle cx="16" cy="16" r="6" fill="#facc15"/>
          </svg>
        `),
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });

      if (!value && markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      } else if (value && mapRef.current) {
        if (markerRef.current) {
          markerRef.current.setLatLng([value.lat, value.lng]);
        } else {
          markerRef.current = L.marker([value.lat, value.lng], { icon: customIcon }).addTo(mapRef.current);
        }
        mapRef.current.setView([value.lat, value.lng], 15, { animate: true });
      }
    });
  }, [value]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export function LocationPickerMap({
  value,
  onChange,
  addressValue = "",
  onAddressChange,
}: LocationPickerMapProps) {
  const [showMap, setShowMap] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(addressValue);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: SearchResult[] = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    onAddressChange?.(q);

    // Debounce search
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchAddress(q), 400);
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;

    setSearchQuery(address);
    onAddressChange?.(address);
    setShowResults(false);
    setSearchResults([]);

    onChange({ lat, lng, address });
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Reverse geocode to get address
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((res) => res.json())
      .then((data) => {
        const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setSearchQuery(address);
        onAddressChange?.(address);
        onChange({ lat, lng, address });
      })
      .catch(() => {
        onChange({ lat, lng, address: addressValue });
      });
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
    onAddressChange?.("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-navy-700">Meeting point</label>

      {/* Address search field */}
      <div className="relative" ref={resultsRef}>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search for an address, landmark, or place..."
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="w-full rounded-xl border-2 border-navy-200 bg-white pl-10 pr-4 py-3 text-sm text-navy-900 font-medium placeholder:text-navy-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10 transition-all"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400 animate-spin" />
            )}
          </div>
          {value?.lat && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors font-bold"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border-2 border-navy-200 bg-white shadow-lg overflow-hidden">
            {searchResults.map((result, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-navy-50 transition-colors border-b border-navy-100 last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-navy-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-navy-700 line-clamp-2">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coordinate badge */}
      {value?.lat && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-100 text-xs font-bold text-navy-700">
            <MapPin className="h-3 w-3" />
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        </div>
      )}

      {/* Map */}
      {showMap && isMounted && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-navy-200 shadow-sm" style={{ height: 340 }}>
          <LeafletPicker value={value} onChange={handleMapClick} />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/95 border border-navy-200 px-4 py-1.5 text-xs font-bold text-navy-600 shadow-md pointer-events-none backdrop-blur-sm">
            Click anywhere on the map to place a pin
          </div>
        </div>
      )}
    </div>
  );
}
