"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ExternalLink, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api, type ExperienceListItem } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const STATUS_OPTS = [
  { value: "", label: "All" },
  { value: "pending_review", label: "Pending review" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending_review: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-sand-100 text-navy-500 ring-sand-200",
  paused: "bg-blue-50 text-blue-700 ring-blue-200",
};

function ExperienceRow({
  exp,
  onAction,
}: {
  exp: ExperienceListItem;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handle = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      if (action === "approve") {
        await api.approveExperience(exp.slug);
        toast.success(`"${exp.title}" approved`);
      } else {
        await api.rejectExperience(exp.slug);
        toast.success(`"${exp.title}" sent back to draft`);
      }
      onAction();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-sand-200">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <p className="font-medium text-navy-900 truncate">{exp.title}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1",
              STATUS_BADGE[exp.status ?? "draft"] ?? STATUS_BADGE.draft
            )}
          >
            {exp.status?.replace("_", " ")}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-navy-500">
          <span>{exp.provider_name}</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {exp.city}
          </span>
          <span>€{parseFloat(exp.price_per_person).toFixed(0)} / person</span>
          <span>{exp.category?.name}</span>
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <Link
          href={`/experiences/${exp.slug}`}
          target="_blank"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
        {exp.status !== "active" && (
          <Button
            size="sm"
            onClick={() => handle("approve")}
            loading={loading === "approve"}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Approve
          </Button>
        )}
        {exp.status === "active" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handle("reject")}
            loading={loading === "reject"}
            className="text-red-600 hover:bg-red-50"
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Unpublish
          </Button>
        )}
      </div>
    </div>
  );
}

function ExperiencesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const [experiences, setExperiences] = useState<ExperienceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getAdminExperiences({ status: statusFilter || undefined, page })
      .then((d) => {
        setExperiences(d.results || []);
        setTotal(d.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    router.push(`/admin/experiences?${p.toString()}`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-navy-900">Experiences</h1>
        <p className="mt-1 text-navy-500">{total} total</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_OPTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setParam("status", opt.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              statusFilter === opt.value
                ? "bg-navy-900 text-white"
                : "bg-white text-navy-600 ring-1 ring-sand-200 hover:bg-sand-50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : experiences.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-7 w-7" />}
          title="No experiences found"
          description="Adjust the filter above."
        />
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <ExperienceRow key={exp.id} exp={exp} onAction={load} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-navy-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setParam("page", String(page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages}
              onClick={() => setParam("page", String(page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminExperiencesPage() {
  return (
    <Suspense>
      <ExperiencesContent />
    </Suspense>
  );
}
