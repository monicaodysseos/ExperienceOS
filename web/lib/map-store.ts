import { create } from "zustand";

const CYPRUS_CENTER: [number, number] = [35.1264, 33.4299];
const DEFAULT_ZOOM = 9;

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  permission: "prompt" | "granted" | "denied" | "unavailable";
  loading: boolean;
}

interface MapState {
  geolocation: GeolocationState;
  selectedExperienceId: number | null;
  mapCenter: [number, number];
  mapZoom: number;

  requestGeolocation: () => Promise<void>;
  setSelectedExperience: (id: number | null) => void;
  setMapView: (center: [number, number], zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  geolocation: {
    latitude: null,
    longitude: null,
    permission: "prompt",
    loading: false,
  },
  selectedExperienceId: null,
  mapCenter: CYPRUS_CENTER,
  mapZoom: DEFAULT_ZOOM,

  requestGeolocation: async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      set((s) => ({
        geolocation: { ...s.geolocation, permission: "unavailable" },
      }));
      return;
    }

    set((s) => ({
      geolocation: { ...s.geolocation, loading: true },
    }));

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
          });
        }
      );

      set({
        geolocation: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          permission: "granted",
          loading: false,
        },
        mapCenter: [position.coords.latitude, position.coords.longitude],
        mapZoom: 12,
      });
    } catch {
      set((s) => ({
        geolocation: {
          ...s.geolocation,
          permission: "denied",
          loading: false,
        },
      }));
    }
  },

  setSelectedExperience: (id) => set({ selectedExperienceId: id }),
  setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),
}));
