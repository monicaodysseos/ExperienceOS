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
          <h1 className="text-2xl font-bold text-navy-900">My Experiences</h1>
          <p className="mt-1 text-navy-500">Manage your listed experiences</p>
        </div>
        <Link href="/dashboard/provider/experiences/new">
          <Button>
            <Plus className="h-4 w-4" /> Create New
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
        <div className="mt-6 space-y-3">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between rounded-xl border border-navy-200 bg-white p-5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-navy-900 truncate">
                    {exp.title}
                  </h3>
                  <Badge variant={STATUS_VARIANT[exp.status || "active"] || "default"}>
                    {(exp.status || "active").replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-navy-500">
                  {exp.city} · {exp.category.name} ·{" "}
                  &euro;{parseFloat(exp.price_per_person).toFixed(0)}/person ·{" "}
                  {exp.booking_count} booking{exp.booking_count !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/dashboard/provider/experiences/${exp.slug}/slots`}
                  className="rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy-600"
                  title="Manage time slots"
                >
                  <Calendar className="h-4 w-4" />
                </Link>
                <Link
                  href={`/dashboard/provider/experiences/${exp.slug}/edit`}
                  className="rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy-600"
                  title="Edit"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <Link
                  href={`/experiences/${exp.slug}`}
                  className="rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy-600"
                  title="View public page"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" />
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
