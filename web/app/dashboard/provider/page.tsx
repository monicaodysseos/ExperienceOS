"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Users, Star, TrendingUp, Plus, ArrowRight, Calendar, Clock } from "lucide-react";
import { format, isAfter } from "date-fns";
import { api, type Booking, type ExperienceListItem, type TimeSlot } from "@/lib/api";
import { ProviderGuard } from "@/components/ProviderGuard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface UpcomingSlot extends TimeSlot {
  experienceTitle: string;
  experienceSlug: string;
}

function ProviderDashboardContent() {
  const [experiences, setExperiences] = useState<ExperienceListItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcomingSlots, setUpcomingSlots] = useState<UpcomingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  useEffect(() => {
    api.getMyExperiences().then(async (d) => {
      const exps = d.results || [];
      setExperiences(exps);

      // Fetch all slots in parallel
      const slotResults = await Promise.all(
        exps.map((exp) =>
          api.getTimeSlots(exp.slug)
            .then((res) => (res.results || []).map((s): UpcomingSlot => ({
              ...s,
              experienceTitle: exp.title,
              experienceSlug: exp.slug,
            })))
            .catch(() => [] as UpcomingSlot[])
        )
      );
      const now = new Date();
      const upcoming = slotResults
        .flat()
        .filter((s) => isAfter(new Date(s.start_datetime), now))
        .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
        .slice(0, 8);
      setUpcomingSlots(upcoming);
      setSlotsLoading(false);
    }).catch(() => setSlotsLoading(false));

    api.getProviderBookings().then((d) => setBookings(d.results || [])).catch(() => {});
  }, []);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const ratedExperiences = experiences.filter((e) => parseFloat(e.average_rating || "0") > 0);
  const avgRating = ratedExperiences.length > 0
    ? (ratedExperiences.reduce((sum, e) => sum + parseFloat(e.average_rating || "0"), 0) / ratedExperiences.length).toFixed(1)
    : "0.0";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Provider Dashboard</h1>
          <p className="mt-1 text-navy-500">Manage your experiences and bookings</p>
        </div>
        <Link href="/dashboard/provider/experiences/new">
          <Button>
            <Plus className="h-4 w-4" /> New Experience
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Active Experiences", value: experiences.length, icon: Package, color: "text-teal-600" },
          { label: "Total Bookings", value: bookings.length, icon: Users, color: "text-coral-500" },
          { label: "Avg. Rating", value: avgRating, icon: Star, color: "text-amber-500" },
          { label: "Confirmed", value: confirmedBookings.length, icon: TrendingUp, color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-navy-200 bg-white p-5">
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <p className="mt-3 text-2xl font-bold text-navy-900">{stat.value}</p>
            <p className="text-sm text-navy-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Upcoming Sessions */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900">Upcoming Sessions</h2>
            <Link href="/dashboard/provider/calendar" className="flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800">
              Full calendar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {slotsLoading ? (
            <p className="mt-4 text-sm text-navy-400">Loading…</p>
          ) : upcomingSlots.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-navy-200 py-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-navy-300" />
              <p className="mt-2 text-sm text-navy-500">No upcoming sessions</p>
              <Link
                href="/dashboard/provider/experiences"
                className="mt-3 inline-block text-xs font-medium text-teal-700 hover:text-teal-800"
              >
                Add time slots →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {upcomingSlots.map((slot) => {
                const start = new Date(slot.start_datetime);
                const end = new Date(slot.end_datetime);
                const isFull = slot.spots_remaining === 0;
                return (
                  <Link
                    key={slot.id}
                    href={`/dashboard/provider/experiences/${slot.experienceSlug}/slots`}
                    className="flex items-center justify-between rounded-xl border border-navy-200 bg-white p-4 hover:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                        <span className="text-xs font-semibold leading-none">{format(start, "MMM").toUpperCase()}</span>
                        <span className="text-sm font-bold leading-none">{format(start, "d")}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy-900 line-clamp-1">{slot.experienceTitle}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-500">
                          <Clock className="h-3 w-3" />
                          {format(start, "HH:mm")} – {format(end, "HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${isFull ? "text-red-600" : "text-teal-600"}`}>
                        {slot.spots_remaining}/{slot.spots_total}
                      </p>
                      <p className="text-[10px] text-navy-400">{isFull ? "full" : "available"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900">Recent Bookings</h2>
            <Link href="/dashboard/provider/bookings" className="flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="mt-4 text-sm text-navy-500">No bookings yet</p>
          ) : (
            <div className="mt-4 space-y-2">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-navy-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-navy-900">{b.experience_title}</p>
                    <p className="text-xs text-navy-500">
                      {formatDate(b.time_slot.start_datetime)} · {b.num_participants} guest{b.num_participants > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge variant={b.status === "confirmed" ? "success" : "default"}>
                    {b.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProviderDashboardPage() {
  return (
    <ProviderGuard>
      <ProviderDashboardContent />
    </ProviderGuard>
  );
}
