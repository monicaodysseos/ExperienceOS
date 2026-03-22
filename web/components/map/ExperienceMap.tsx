"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { ExperienceMapItem } from "@/lib/api";
import { useMapStore } from "@/lib/map-store";
import { MapControls } from "./MapControls";
import { MapPopup } from "./MapPopup";

// Exact-location marker (ViVi DO Orange Blob)
const exactIcon = new Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M 24 4 C 36 4 44 14 40 28 C 36 42 24 44 12 40 C 0 36 2 18 10 10 C 16 4 24 4 24 4 Z" fill="#ff751f" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="23" cy="24" r="8" fill="#ffffff" stroke="#1a1a1a" stroke-width="3"/>
    </svg>
  `),
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -18],
  className: 'custom-experience-marker drop-shadow-lg'
});

// City-fallback marker (ViVi DO Blue Blob)
const cityIcon = new Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M 24 4 C 12 4 4 14 8 28 C 12 42 24 44 36 40 C 48 36 46 18 38 10 C 32 4 24 4 24 4 Z" fill="#3d98d6" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="25" cy="24" r="6" fill="#ffffff" stroke="#1a1a1a" stroke-width="3"/>
    </svg>
  `),
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -16],
  className: 'custom-experience-marker-city drop-shadow-md opacity-90'
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
        className="w-full h-full rounded-[2.5rem] border-4 border-navy-900 shadow-[6px_6px_0_theme(colors.navy.900)] overflow-hidden"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
