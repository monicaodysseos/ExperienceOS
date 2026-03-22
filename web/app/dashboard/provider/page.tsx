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
          <h1 className="font-display text-5xl font-black text-navy-900 title-shadow">Provider Dashboard</h1>
          <p className="mt-4 text-xl font-bold text-navy-500">Manage your experiences and bookings</p>
        </div>
        <Link href="/dashboard/provider/experiences/new">
          <Button size="lg" className="rounded-full border-4 border-navy-900 shadow-playful hover:shadow-playful-hover hover:-translate-y-1 transition-all bg-purple-400 text-navy-900 font-black">
            <Plus className="h-5 w-5 mr-1 border-2 border-navy-900 rounded-full" /> New Experience
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-10 grid gap-6 sm:grid-cols-4">
        {[
          { label: "Active Experiences", value: experiences.length, icon: Package, color: "text-purple-500", bg: "bg-purple-100" },
          { label: "Total Bookings", value: bookings.length, icon: Users, color: "text-orange-500", bg: "bg-orange-100" },
          { label: "Avg. Rating", value: avgRating, icon: Star, color: "text-blue-500", bg: "bg-blue-100" },
          { label: "Confirmed", value: confirmedBookings.length, icon: TrendingUp, color: "text-light-green-600", bg: "bg-light-green-100" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[2.5rem] border-4 border-navy-900 bg-white p-6 shadow-playful hover:-translate-y-1 hover:shadow-playful-hover transition-all">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] mb-4 ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <p className="font-display text-4xl font-black text-navy-900 title-shadow">{stat.value}</p>
            <p className="mt-2 text-sm font-bold text-navy-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {/* Upcoming Sessions */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-black text-navy-900 title-shadow">Upcoming Sessions</h2>
            <Link href="/dashboard/provider/calendar" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest">
              Full calendar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {slotsLoading ? (
            <p className="mt-6 text-sm font-bold text-navy-400">Loading…</p>
          ) : upcomingSlots.length === 0 ? (
            <div className="mt-6 rounded-[2.5rem] border-4 border-dashed border-navy-400 p-12 text-center bg-navy-50">
              <Calendar className="mx-auto h-12 w-12 text-navy-300 mb-4" />
              <p className="text-lg font-bold text-navy-500">No upcoming sessions</p>
              <Link
                href="/dashboard/provider/experiences"
                className="mt-4 inline-block text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Add time slots →
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {upcomingSlots.map((slot) => {
                const start = new Date(slot.start_datetime);
                const end = new Date(slot.end_datetime);
                const isFull = slot.spots_remaining === 0;
                return (
                  <Link
                    key={slot.id}
                    href={`/dashboard/provider/experiences/${slot.experienceSlug}/slots`}
                    className="flex items-center justify-between rounded-[2rem] border-4 border-navy-900 bg-white p-5 shadow-playful hover:-translate-y-1 hover:shadow-playful-hover transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] bg-light-green-400 text-navy-900">
                        <span className="text-xs font-black uppercase leading-none">{format(start, "MMM")}</span>
                        <span className="text-xl font-black leading-none mt-1">{format(start, "d")}</span>
                      </div>
                      <div>
                        <p className="font-display text-xl font-black text-navy-900 line-clamp-1">{slot.experienceTitle}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-navy-500">
                          <Clock className="h-4 w-4" />
                          {format(start, "HH:mm")} – {format(end, "HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex px-3 py-1 rounded-full border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] ${isFull ? "bg-orange-400" : "bg-white"}`}>
                        <p className={`text-sm font-black ${isFull ? "text-navy-900" : "text-blue-600"}`}>
                          {slot.spots_remaining}/{slot.spots_total}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-navy-500 mt-2 uppercase tracking-wide">{isFull ? "full" : "available"}</p>
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
            <h2 className="font-display text-3xl font-black text-navy-900 title-shadow">Recent Bookings</h2>
            <Link href="/dashboard/provider/bookings" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="mt-6 text-sm font-bold text-navy-500">No bookings yet</p>
          ) : (
            <div className="mt-8 space-y-4">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-[2rem] border-4 border-navy-900 bg-white p-5 shadow-playful hover:-translate-y-1 hover:shadow-playful-hover transition-all">
                  <div>
                    <p className="font-display text-lg font-black text-navy-900 line-clamp-1">{b.experience_title}</p>
                    <p className="mt-1 text-sm font-bold text-navy-500">
                      {formatDate(b.time_slot.start_datetime)} · {b.num_participants} guest{b.num_participants > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="scale-90 origin-right">
                    <Badge variant={b.status === "confirmed" ? "success" : "default"} className="font-black border-2 border-navy-900 shadow-sm uppercase px-3 py-1 text-sm rounded-full">
                      {b.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
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
