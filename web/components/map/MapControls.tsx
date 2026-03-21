"use client";

import { useMapStore } from "@/lib/map-store";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

export function MapControls() {
  const map = useMap();
  const { requestGeolocation, geolocation, mapCenter, mapZoom } =
    useMapStore();

  useEffect(() => {
    if (mapCenter) {
      map.setView(mapCenter, mapZoom);
    }
  }, [mapCenter, mapZoom, map]);

  const handleLocate = async () => {
    await requestGeolocation();
  };

  const hasLocation = geolocation.latitude !== null && geolocation.longitude !== null;

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={handleLocate}
        disabled={geolocation.loading}
        className="bg-white border-2 border-navy-900 rounded-md p-3 hover:bg-sand-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-card"
        title={
          hasLocation
            ? "Center on your location"
            : "Request location permission"
        }
      >
        {geolocation.loading ? (
          <svg
            className="w-5 h-5 text-navy-900 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-navy-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
