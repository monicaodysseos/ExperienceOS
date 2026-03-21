"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Package,
  CalendarDays,
  Euro,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { api, type AdminStats } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

function StatCard({
  label,
  value,
  sub,
  icon,
  href,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  href?: string;
  alert?: boolean;
}) {
  const content = (
    <div
      className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ${alert ? "ring-crimson-200" : "ring-sand-200"} transition-all hover:-translate-y-0.5 hover:shadow-card`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${alert ? "bg-crimson-50 text-crimson-600" : "bg-navy-50 text-navy-600"}`}>
          {icon}
        </div>
        {href && <ArrowRight className="h-4 w-4 text-navy-300" />}
      </div>
      <p className="mt-4 text-3xl font-semibold text-navy-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-navy-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-navy-400">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAdminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy-900">
        Platform Overview
      </h1>
      <p className="mt-1 text-navy-500">ExperienceOS admin dashboard</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={stats?.total_users ?? 0}
          icon={<Users className="h-5 w-5" />}
          href="/admin/users"
        />
        <StatCard
          label="Vendors"
          value={stats?.total_vendors ?? 0}
          sub={
            stats?.pending_vendors
              ? `${stats.pending_vendors} pending approval`
              : "All verified"
          }
          icon={<Users className="h-5 w-5" />}
          href="/admin/vendors"
          alert={!!stats?.pending_vendors}
        />
        <StatCard
          label="Experiences"
          value={stats?.total_experiences ?? 0}
          sub={
            stats?.pending_experiences
              ? `${stats.pending_experiences} pending review`
              : "All live"
          }
          icon={<Package className="h-5 w-5" />}
          href="/admin/experiences"
          alert={!!stats?.pending_experiences}
        />
        <StatCard
          label="Total bookings"
          value={stats?.total_bookings ?? 0}
          icon={<CalendarDays className="h-5 w-5" />}
          href="/admin/bookings"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Platform revenue"
          value={`€${parseFloat(stats?.total_revenue ?? "0").toFixed(0)}`}
          sub="All-time gross booking value"
          icon={<Euro className="h-5 w-5" />}
        />
        {(stats?.pending_vendors ?? 0) + (stats?.pending_experiences ?? 0) > 0 && (
          <div className="rounded-2xl bg-crimson-50 p-6 ring-1 ring-crimson-200">
            <div className="flex items-center gap-2 text-crimson-700">
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">Action required</p>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-crimson-600">
              {(stats?.pending_vendors ?? 0) > 0 && (
                <li>
                  <Link href="/admin/vendors?verified=false" className="hover:underline">
                    → {stats?.pending_vendors} vendor{stats?.pending_vendors !== 1 ? "s" : ""} awaiting approval
                  </Link>
                </li>
              )}
              {(stats?.pending_experiences ?? 0) > 0 && (
                <li>
                  <Link href="/admin/experiences?status=pending_review" className="hover:underline">
                    → {stats?.pending_experiences} experience{stats?.pending_experiences !== 1 ? "s" : ""} pending review
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
