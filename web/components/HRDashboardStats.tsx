import Link from "next/link";
import { CalendarDays, TrendingUp, Users, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgDashboard } from "@/lib/api";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  href?: string;
  accent?: string;
}

function StatCard({ label, value, sub, icon, href, accent = "bg-teal-50 text-teal-600" }: StatCardProps) {
  const inner = (
    <div className="flex h-full flex-col justify-between">
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", accent)}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-semibold text-navy-900">{value}</p>
        <p className="mt-1 text-sm font-medium text-navy-500">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-navy-400">{sub}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200 transition-all hover:-translate-y-0.5 hover:shadow-card hover:ring-sand-300 min-h-[140px] flex flex-col justify-between"
      >
        {inner}
        <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-navy-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200 min-h-[140px] flex flex-col justify-between">
      {inner}
    </div>
  );
}

interface HRDashboardStatsProps {
  data: OrgDashboard | null;
  loading?: boolean;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200 min-h-[140px] animate-pulse">
      <div className="h-11 w-11 rounded-xl bg-sand-100" />
      <div className="mt-8 h-8 w-24 rounded-lg bg-sand-100" />
      <div className="mt-2 h-4 w-32 rounded bg-sand-100" />
    </div>
  );
}

export function HRDashboardStats({ data, loading }: HRDashboardStatsProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  const totalSpend = parseFloat(data.total_spend);
  const avgPerHead = parseFloat(data.avg_per_head);
  const ytdSpend = parseFloat(data.ytd_spend);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total bookings"
        value={String(data.total_bookings)}
        sub={data.total_bookings === 1 ? "1 experience booked" : `${data.total_bookings} experiences booked`}
        icon={<CalendarDays className="h-5 w-5" />}
        href="/dashboard/bookings"
        accent="bg-teal-50 text-teal-600"
      />
      <StatCard
        label="Total spend"
        value={`€${totalSpend.toLocaleString("en-EU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        sub={`€${ytdSpend.toLocaleString("en-EU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} this year`}
        icon={<TrendingUp className="h-5 w-5" />}
        href="/dashboard/analytics"
        accent="bg-emerald-50 text-emerald-600"
      />
      <StatCard
        label="Upcoming events"
        value={String(data.upcoming_count)}
        sub="Confirmed or pending payment"
        icon={<CalendarDays className="h-5 w-5" />}
        href="/dashboard/bookings?status=confirmed"
        accent="bg-purple-50 text-purple-600"
      />
      <StatCard
        label="Avg. per person"
        value={avgPerHead > 0 ? `€${avgPerHead.toFixed(0)}` : "—"}
        sub="Across all bookings"
        icon={<Users className="h-5 w-5" />}
        accent="bg-amber-50 text-amber-600"
      />
    </div>
  );
}
