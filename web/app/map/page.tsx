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
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-navy-900">
              Explore Experiences
            </h1>
            <p className="text-navy-600">
              Discover unique activities on the map. Click markers to view details.
            </p>
          </div>
          <MapPageClient />
        </div>
      </div>
    </main>
  );
}
