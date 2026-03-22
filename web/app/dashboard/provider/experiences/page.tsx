"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ExternalLink, Settings, Calendar } from "lucide-react";
import { api, type ExperienceListItem } from "@/lib/api";
import { ProviderGuard } from "@/components/ProviderGuard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "default"> = {
  active: "success",
  draft: "default",
  pending_review: "warning",
  paused: "info",
  archived: "default",
};

function ExperiencesListContent() {
  const [experiences, setExperiences] = useState<ExperienceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMyExperiences()
      .then((d) => setExperiences(d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-black text-navy-900 title-shadow">My Experiences</h1>
          <p className="mt-2 text-lg font-bold text-navy-500">Manage your listed experiences</p>
        </div>
        <Link href="/dashboard/provider/experiences/new">
          <Button size="lg" className="rounded-full border-4 border-navy-900 shadow-playful hover:shadow-playful-hover hover:-translate-y-1 transition-all bg-purple-400 text-navy-900 font-black">
            <Plus className="h-5 w-5 mr-1 border-2 border-navy-900 rounded-full" /> Create New
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : experiences.length === 0 ? (
        <EmptyState
          title="No experiences yet"
          description="Create your first experience and start hosting guests."
          action={{ label: "Create Experience", href: "/dashboard/provider/experiences/new" }}
          className="mt-8"
        />
      ) : (
        <div className="mt-8 space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between rounded-[2rem] border-4 border-navy-900 bg-white p-6 shadow-playful transition-all hover:-translate-y-1 hover:shadow-playful-hover"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4">
                  <h3 className="font-display text-2xl font-black text-navy-900 truncate">
                    {exp.title}
                  </h3>
                  <div className="origin-left scale-110">
                    <Badge variant={STATUS_VARIANT[exp.status || "active"] || "default"}>
                      {(exp.status || "active").replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold text-navy-500">
                  {exp.city} · {exp.category.name} ·{" "}
                  &euro;{parseFloat(exp.price_per_person).toFixed(0)}/person ·{" "}
                  {exp.booking_count} booking{exp.booking_count !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-3 ml-6">
                <Link
                  href={`/dashboard/provider/experiences/${exp.slug}/slots`}
                  className="rounded-full border-2 border-navy-900 bg-light-green-400 p-3 text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] hover:shadow-sm hover:-translate-y-0.5 transition-all"
                  title="Manage time slots"
                >
                  <Calendar className="h-5 w-5" />
                </Link>
                <Link
                  href={`/dashboard/provider/experiences/${exp.slug}/edit`}
                  className="rounded-full border-2 border-navy-900 bg-yellow-400 p-3 text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] hover:shadow-sm hover:-translate-y-0.5 transition-all"
                  title="Edit"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <Link
                  href={`/experiences/${exp.slug}`}
                  className="rounded-full border-2 border-navy-900 bg-blue-400 p-3 text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] hover:shadow-sm hover:-translate-y-0.5 transition-all"
                  title="View public page"
                  target="_blank"
                >
                  <ExternalLink className="h-5 w-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProviderExperiencesPage() {
  return (
    <ProviderGuard>
      <ExperiencesListContent />
    </ProviderGuard>
  );
}
