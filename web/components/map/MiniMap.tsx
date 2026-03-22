"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { api, ExperienceMapItem } from "@/lib/api";
import { MapSkeleton } from "./MapSkeleton";
import Link from "next/link";

const ExperienceMap = dynamic(
  () => import("./ExperienceMap").then((mod) => ({ default: mod.ExperienceMap })),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export function MiniMap() {
  const [experiences, setExperiences] = useState<ExperienceMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExperiences = async () => {
      try {
        const data = await api.getExperiencesForMap();
        setExperiences(data.results);
      } catch (error) {
        console.error("Failed to load map experiences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiences();
  }, []);

  if (isLoading) {
    return <MapSkeleton />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-navy-900">
          Explore on Map
        </h2>
        <Link
          href="/map"
          className="text-sm font-bold text-navy-900 bg-yellow-400 px-4 py-2 rounded-full border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] hover:bg-yellow-500 hover:-translate-y-0.5 transition-all"
        >
          View Full Map →
        </Link>
      </div>
      <Suspense fallback={<MapSkeleton />}>
        <ExperienceMap
          experiences={experiences}
          height="h-[400px]"
          showControls={true}
        />
      </Suspense>
    </div>
  );
}
