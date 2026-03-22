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

function StatCard({ label, value, sub, icon, href, accent = "bg-blue-400" }: StatCardProps) {
  const inner = (
    <div className="flex h-full flex-col justify-between">
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full border-4 border-navy-900 shadow-playful", accent)}>
        {icon}
      </div>
      <div className="mt-4">
        <p className="font-display text-4xl font-bold text-navy-900 ">{value}</p>
        <p className="mt-2 text-base font-bold text-navy-900">{label}</p>
        {sub && <p className="mt-1 text-sm font-semibold text-navy-800 opacity-90">{sub}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group relative rounded-[2.5rem] bg-white p-6 transition-transform hover:-translate-y-2 min-h-[180px] flex flex-col justify-between shadow-playful hover:shadow-playful-hover border-4 border-navy-900"
      >
        {inner}
        <ArrowUpRight className="absolute right-6 top-6 h-6 w-6 text-navy-900 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-125" />
      </Link>
    );
  }

  return (
    <div className="rounded-[2.5rem] bg-white p-6 shadow-playful border-4 border-navy-900 min-h-[180px] flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-playful-hover cursor-default">
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
        icon={<CalendarDays className="h-6 w-6 text-navy-900" />}
        href="/dashboard/bookings"
        accent="bg-orange-400"
      />
      <StatCard
        label="Total spend"
        value={`€${totalSpend.toLocaleString("en-EU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        sub={`€${ytdSpend.toLocaleString("en-EU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} this year`}
        icon={<TrendingUp className="h-6 w-6 text-navy-900" />}
        href="/dashboard/analytics"
        accent="bg-blue-400"
      />
      <StatCard
        label="Upcoming events"
        value={String(data.upcoming_count)}
        sub="Confirmed or pending payment"
        icon={<CalendarDays className="h-6 w-6 text-navy-900" />}
        href="/dashboard/bookings?status=confirmed"
        accent="bg-purple-400"
      />
      <StatCard
        label="Avg. per person"
        value={avgPerHead > 0 ? `€${avgPerHead.toFixed(0)}` : "—"}
        sub="Across all bookings"
        icon={<Users className="h-6 w-6 text-navy-900" />}
        accent="bg-yellow-400"
      />
    </div>
  );
}
