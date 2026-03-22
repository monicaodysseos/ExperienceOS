import { Metadata } from "next";
import { MapPageClient } from "./MapPageClient";

export const metadata: Metadata = {
  title: "Explore Map | ExperienceOS",
  description: "Browse experiences on an interactive map. Find activities near you or explore destinations around the world.",
};

export const dynamic = "force-dynamic";

export default function MapPage() {
  return (
    <main className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        <div className="space-y-8">
          <div className="relative">
            {/* Playful background blob */}
            <div className="absolute -inset-4 z-0 bg-yellow-300 w-48 h-20 rounded-[2.5rem] shadow-playful -rotate-2 mix-blend-multiply opacity-50" />
            <div className="relative z-10 space-y-2">
              <h1 className="font-display text-4xl sm:text-6xl font-bold text-navy-900 ">
                Explore Experiences
              </h1>
              <p className="text-lg font-bold text-navy-600 max-w-2xl">
                Discover unique activities across Cyprus. Spin around, zoom in, and click our playful markers to find your next adventure.
              </p>
            </div>
          </div>
          <div className="relative z-20">
            <MapPageClient />
          </div>
        </div>
      </div>
    </main>
  );
}
