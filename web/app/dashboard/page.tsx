"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Building2,
  Plus,
} from "lucide-react";
import { api, type Booking, type OrgDashboard } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { HRDashboardStats } from "@/components/HRDashboardStats";
import { formatDate, formatTime } from "@/lib/utils";

// ─── HR Manager Dashboard ────────────────────────────────────────────────────

function HRDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<OrgDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getOrgDashboard()
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-5xl sm:text-6xl font-black text-navy-900 title-shadow">
            Ready to spark some creativity, {user?.first_name}? ✨
          </h1>
          {dashboard?.org && (
            <p className="mt-3 text-xl font-bold text-navy-700 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-purple-500" />
              {dashboard.org.name}
            </p>
          )}
        </div>
        <Link href="/experiences">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Book Experience
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-10">
        <HRDashboardStats data={dashboard} loading={loading} />
      </div>

      {/* No org yet */}
      {!loading && !dashboard?.org?.id && (
        <div className="mt-12 rounded-[2.5rem] border-4 border-navy-900 bg-orange-400 p-10 text-center shadow-playful blob-shape-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 blur-xl pointer-events-none"></div>
          <Building2 className="mx-auto h-16 w-16 text-navy-900 mb-6 relative z-10" />
          <h3 className="font-display text-4xl font-black text-navy-900 title-shadow relative z-10">
            Bring your team onboard! 🚀
          </h3>
          <p className="mt-4 text-xl font-bold text-navy-900 opacity-90 relative z-10">
            Create your company account to unlock team bookings, B2B invoices, and spend tracking.
          </p>
          <Link href="/dashboard/team" className="mt-8 inline-block relative z-10">
            <Button size="lg" className="bg-white text-navy-900 border-4 border-navy-900 shadow-playful hover:shadow-playful-hover">
              Create Organisation
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Bookings */}
      {!loading && dashboard && dashboard.recent_bookings.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-black text-navy-900 title-shadow">
              Recent bookings
            </h2>
            <Link
              href="/dashboard/bookings"
              className="flex items-center gap-2 text-base font-bold text-navy-700 hover:text-navy-900 transition-colors bg-white px-4 py-2 border-2 border-navy-900 rounded-full shadow-sm"
            >
              View all <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="space-y-4">
            {dashboard.recent_bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.booking_reference}`}
                className="flex items-center justify-between rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful transition-all hover:-translate-y-1 hover:shadow-playful-hover"
              >
                <div>
                  <p className="font-bold text-xl text-navy-900">
                    {booking.experience_title}
                  </p>
                  <p className="mt-1 text-base font-medium text-navy-600">
                    {formatDate(booking.time_slot.start_datetime)} · {booking.num_participants} person{booking.num_participants > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xl font-black text-navy-900 title-shadow">
                    €{parseFloat(booking.total_price).toFixed(0)}
                  </span>
                  <BookingStatusBadge status={booking.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Participant Dashboard (existing) ────────────────────────────────────────

function ParticipantDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMyBookings().then((d) => setBookings(d.results?.slice(0, 3) || [])),
      api.getUnreadCount().then((d) => setUnread(d.unread_count)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter(
    (b) => new Date(b.time_slot.start_datetime) >= new Date() && !b.status.includes("cancelled")
  );

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="font-display text-5xl sm:text-6xl font-black text-navy-900 title-shadow">
        Ready for some fun, {user?.first_name}? 🎨
      </h1>
      <p className="mt-4 text-xl font-bold text-navy-700">Here&apos;s your creative agenda</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <Link
          href="/bookings"
          className="rounded-[2.5rem] bg-blue-300 p-8 border-4 border-navy-900 transition-transform hover:-translate-y-2 shadow-playful hover:shadow-playful-hover min-h-[200px] flex flex-col justify-between"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-navy-900 shadow-playful bg-white text-navy-900 mb-6 relative overflow-hidden">
            <CalendarDays className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-12 w-16 rounded-lg mb-2 bg-navy-900/10" />
            ) : (
              <p className="font-display text-5xl font-black text-navy-900 title-shadow">{upcoming.length}</p>
            )}
            <p className="mt-2 text-lg font-bold text-navy-900">Upcoming bookings</p>
          </div>
        </Link>

        <Link
          href="/dashboard/messages"
          className="rounded-[2.5rem] bg-orange-400 p-8 border-4 border-navy-900 transition-transform hover:-translate-y-2 shadow-playful hover:shadow-playful-hover min-h-[200px] flex flex-col justify-between"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-navy-900 shadow-playful bg-white mb-6">
            <MessageSquare className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-12 w-12 rounded-lg mb-2 bg-navy-900/10" />
            ) : (
              <p className="font-display text-5xl font-black text-navy-900 title-shadow">{unread}</p>
            )}
            <p className="mt-2 text-lg font-bold text-navy-900">Unread messages</p>
          </div>
        </Link>

        {!user?.has_provider_profile && (
          <Link
            href="/dashboard/provider/onboarding"
            className="rounded-[2.5rem] bg-purple-400 p-8 border-4 border-navy-900 transition-transform hover:-translate-y-2 shadow-playful hover:shadow-playful-hover flex flex-col justify-between min-h-[200px]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-navy-900 shadow-playful bg-white mb-6">
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <p className="font-display text-3xl font-black text-navy-900 title-shadow leading-tight">Become a Provider</p>
              <p className="mt-2 text-lg font-bold text-navy-900">Start hosting experiences</p>
            </div>
          </Link>
        )}
      </div>

      {upcoming.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-black text-navy-900 title-shadow">Your Next Experience</h2>
            <Link href="/bookings" className="flex items-center gap-2 text-base font-bold text-navy-700 hover:text-navy-900 bg-white px-4 py-2 border-2 border-navy-900 rounded-full shadow-sm transition-transform hover:-translate-y-0.5">
              View all <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <Link
            href={`/bookings/${upcoming[0].booking_reference}`}
            className="block rounded-[2.5rem] bg-white p-8 border-4 border-navy-900 shadow-playful transition-transform hover:-translate-y-1 hover:shadow-playful-hover"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-3xl font-bold text-navy-900">{upcoming[0].experience_title}</h3>
                <p className="mt-3 text-lg font-bold text-navy-600">
                  {formatDate(upcoming[0].time_slot.start_datetime)} at {formatTime(upcoming[0].time_slot.start_datetime)}
                </p>
              </div>
              <BookingStatusBadge status={upcoming[0].status} />
            </div>
          </Link>
        </div>
      )}

      <div className="mt-16 bg-light-green-400 p-10 rounded-[3rem] border-4 border-navy-900 shadow-playful relative blob-shape-2">
        <h2 className="font-display text-4xl font-black text-navy-900 mb-8 title-shadow">Quick Actions</h2>
        <div className="flex flex-wrap gap-4 relative z-10">
          <Link href="/experiences"><Button variant="outline" size="lg">Browse Experiences</Button></Link>
          <Link href="/dashboard/messages"><Button variant="primary" size="lg">Messages</Button></Link>
          <Link href="/dashboard/profile"><Button variant="secondary" size="lg">Edit Profile</Button></Link>
        </div>
      </div>
    </div>
  );
}

// ─── Route ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "hr_manager") return <HRDashboard />;
  return <ParticipantDashboard />;
}
