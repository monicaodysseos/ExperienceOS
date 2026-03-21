"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { ExperienceMapItem } from "@/lib/api";
import { useMapStore } from "@/lib/map-store";
import { MapControls } from "./MapControls";
import { MapPopup } from "./MapPopup";

// Exact-location marker (teal filled)
const exactIcon = new Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#1a1a1a" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
  className: 'custom-experience-marker'
});

// City-fallback marker (lighter, outline style)
const cityIcon = new Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="white" stroke="#6b7280" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="#6b7280"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
  className: 'custom-experience-marker-city'
});

// Default coordinates for Cyprus cities
const CITY_COORDS: Record<string, [number, number]> = {
  nicosia: [35.1856, 33.3823],
  limassol: [34.6841, 33.0371],
  paphos: [34.7757, 32.4243],
  larnaca: [34.9229, 33.6233],
  "ayia napa": [34.9842, 34.0000],
};

interface ExperienceMapProps {
  experiences: ExperienceMapItem[];
  height?: string;
  showControls?: boolean;
}

interface MappedExperience {
  experience: ExperienceMapItem;
  position: [number, number];
  isExact: boolean;
}

export function ExperienceMap({
  experiences,
  height = "h-[600px]",
  showControls = true,
}: ExperienceMapProps) {
  const { mapCenter, mapZoom } = useMapStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const mapped: MappedExperience[] = experiences.reduce<MappedExperience[]>((acc, exp) => {
    if (exp.latitude && exp.longitude) {
      acc.push({
        experience: exp,
        position: [parseFloat(exp.latitude), parseFloat(exp.longitude)],
        isExact: true,
      });
    } else {
      const key = exp.city?.toLowerCase();
      const fallback = key ? CITY_COORDS[key] : undefined;
      if (fallback) {
        acc.push({ experience: exp, position: fallback, isExact: false });
      }
    }
    return acc;
  }, []);

  return (
    <div className={`w-full ${height} relative`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full rounded-lg border-2 border-navy-900 shadow-card"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        />
        {mapped.map(({ experience, position, isExact }) => (
          <Marker
            key={experience.id}
            position={position}
            icon={isExact ? exactIcon : cityIcon}
          >
            <Popup>
              <MapPopup experience={experience} approximate={!isExact} />
            </Popup>
          </Marker>
        ))}
        {showControls && <MapControls />}
      </MapContainer>
    </div>
  );
}
