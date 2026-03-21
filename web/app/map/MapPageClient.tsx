"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { api, ExperienceMapItem } from "@/lib/api";
import { MapSkeleton } from "@/components/map";

const ExperienceMap = dynamic(
  () => import("@/components/map").then((mod) => ({ default: mod.ExperienceMap })),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export function MapPageClient() {
  const [experiences, setExperiences] = useState<ExperienceMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExperiences = async () => {
      try {
        const data = await api.getExperiencesForMap();
        setExperiences(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load experiences");
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiences();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-80px)]">
        <MapSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-navy-900">Failed to load map</p>
          <p className="text-sm text-navy-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-80px)]">
      <Suspense fallback={<MapSkeleton />}>
        <ExperienceMap
          experiences={experiences}
          height="h-full"
          showControls={true}
        />
      </Suspense>
    </div>
  );
}
