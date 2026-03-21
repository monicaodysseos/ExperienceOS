"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, ArrowRight } from "lucide-react";
import { api, type OrgAnalytics } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function SpendBar({
  label,
  spend,
  max,
  count,
}: {
  label: string;
  spend: number;
  max: number;
  count: number;
}) {
  const pct = max > 0 ? (spend / max) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-36 shrink-0 text-sm text-navy-700 truncate text-right">{label}</div>
      <div className="flex-1 relative h-7 rounded-lg bg-sand-100 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-lg bg-teal-500 transition-all"
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-navy-700">
          €{spend.toFixed(0)}
        </span>
      </div>
      <div className="w-16 shrink-0 text-right text-xs text-navy-400">{count} booking{count !== 1 ? "s" : ""}</div>
    </div>
  );
}

function MonthBar({
  month,
  spend,
  max,
}: {
  month: string;
  spend: number;
  max: number;
}) {
  const pct = max > 0 ? (spend / max) * 100 : 0;
  const label = new Date(month + "-01").toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
  });
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 relative flex flex-col justify-end" style={{ height: 80 }}>
        <div
          className="w-full rounded-t-md bg-teal-500 transition-all"
          style={{ height: `${pct}%`, minHeight: spend > 0 ? 4 : 0 }}
        />
      </div>
      <span className="text-xs text-navy-400">{label}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<OrgAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    api
      .getOrgAnalytics()
      .then((d) => {
        setData(d);
        const hasData =
          d.category_breakdown.length > 0 ||
          d.monthly_spend.length > 0 ||
          d.top_experiences.length > 0;
        if (!hasData) setEmpty(true);
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (empty || !data) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="font-display text-3xl font-semibold text-navy-900">Analytics</h1>
        <div className="mt-8">
          <EmptyState
            icon={<BarChart3 className="h-7 w-7" />}
            title="No data yet"
            description="Analytics will appear once your team has made bookings."
            action={{ label: "Browse Experiences", href: "/experiences" }}
          />
        </div>
      </div>
    );
  }

  const maxCategorySpend = Math.max(
    ...data.category_breakdown.map((c) => parseFloat(c.spend))
  );
  const maxMonthlySpend = Math.max(
    ...data.monthly_spend.map((m) => parseFloat(m.spend))
  );
  const totalSpend = data.category_breakdown.reduce(
    (sum, c) => sum + parseFloat(c.spend),
    0
  );

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy-900">Analytics</h1>
        <p className="mt-1 text-navy-500">Team spend and booking trends</p>
      </div>

      {/* Spend by category */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-navy-900">Spend by category</h2>
            <p className="text-sm text-navy-400 mt-0.5">
              Total: €{totalSpend.toFixed(2)}
            </p>
          </div>
          <BarChart3 className="h-5 w-5 text-navy-300" />
        </div>
        <div className="space-y-3">
          {data.category_breakdown.map((cat) => (
            <SpendBar
              key={cat.category}
              label={cat.category}
              spend={parseFloat(cat.spend)}
              max={maxCategorySpend}
              count={cat.count}
            />
          ))}
        </div>
      </div>

      {/* Monthly spend chart */}
      {data.monthly_spend.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-navy-900">Monthly spend</h2>
            <TrendingUp className="h-5 w-5 text-navy-300" />
          </div>
          <div className="flex items-end gap-2 overflow-x-auto pb-2">
            {data.monthly_spend.map((m) => (
              <MonthBar
                key={m.month}
                month={m.month}
                spend={parseFloat(m.spend)}
                max={maxMonthlySpend}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top experiences */}
      {data.top_experiences.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200">
          <h2 className="font-semibold text-navy-900 mb-4">Top experiences</h2>
          <div className="space-y-3">
            {data.top_experiences.map((exp, i) => (
              <div
                key={exp.slug}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand-100 text-xs font-semibold text-navy-500">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-navy-900">{exp.title}</p>
                    <p className="text-xs text-navy-400">
                      {exp.count} booking{exp.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-navy-900">
                    €{parseFloat(exp.spend).toFixed(0)}
                  </span>
                  <Link
                    href={`/experiences/${exp.slug}`}
                    className="text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
