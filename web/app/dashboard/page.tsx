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
          <h1 className="font-display text-4xl font-semibold text-navy-900">
            Welcome back, {user?.first_name}
          </h1>
          {dashboard?.org && (
            <p className="mt-1 text-lg text-navy-500 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
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
        <div className="mt-8 rounded-2xl border-2 border-dashed border-navy-200 bg-white p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-navy-300 mb-4" />
          <h3 className="font-display text-xl font-semibold text-navy-900">
            Set up your organisation
          </h3>
          <p className="mt-2 text-navy-500">
            Create your company account to unlock team bookings, B2B invoices, and spend tracking.
          </p>
          <Link href="/dashboard/team" className="mt-4 inline-block">
            <Button size="sm" variant="secondary">
              Create Organisation
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Bookings */}
      {!loading && dashboard && dashboard.recent_bookings.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold text-navy-900">
              Recent bookings
            </h2>
            <Link
              href="/dashboard/bookings"
              className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {dashboard.recent_bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.booking_reference}`}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-sand-200 transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div>
                  <p className="font-medium text-navy-900">
                    {booking.experience_title}
                  </p>
                  <p className="mt-0.5 text-sm text-navy-500">
                    {formatDate(booking.time_slot.start_datetime)} · {booking.num_participants} person{booking.num_participants > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-navy-900">
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
      <h1 className="font-display text-4xl font-semibold text-navy-900">
        Welcome back, {user?.first_name}!
      </h1>
      <p className="mt-2 text-lg text-navy-500">Here&apos;s what&apos;s happening</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <Link
          href="/bookings"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200 transition-all hover:-translate-y-1 hover:shadow-card hover:ring-sand-300"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-6">
            <CalendarDays className="h-6 w-6" />
          </div>
          {loading ? (
            <Skeleton className="h-10 w-12 rounded-lg mb-2" />
          ) : (
            <p className="text-4xl font-semibold text-navy-900">{upcoming.length}</p>
          )}
          <p className="mt-2 text-sm font-medium text-navy-500">Upcoming bookings</p>
        </Link>

        <Link
          href="/dashboard/messages"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200 transition-all hover:-translate-y-1 hover:shadow-card hover:ring-sand-300"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral-50 text-coral-500 mb-6">
            <MessageSquare className="h-6 w-6" />
          </div>
          {loading ? (
            <Skeleton className="h-10 w-8 rounded-lg mb-2" />
          ) : (
            <p className="text-4xl font-semibold text-navy-900">{unread}</p>
          )}
          <p className="mt-2 text-sm font-medium text-navy-500">Unread messages</p>
        </Link>

        {!user?.has_provider_profile && (
          <Link
            href="/dashboard/provider/onboarding"
            className="rounded-2xl border-2 border-dashed border-crimson-200 bg-crimson-50/50 p-6 transition-all hover:-translate-y-1 hover:shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-crimson-100 text-crimson-600 mb-6">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold text-crimson-800">Become a Provider</p>
            <p className="mt-1 text-sm font-medium text-crimson-600">Start hosting experiences</p>
          </Link>
        )}
      </div>

      {upcoming.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold text-navy-900">Your Next Experience</h2>
            <Link href="/bookings" className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Link
            href={`/bookings/${upcoming[0].booking_reference}`}
            className="block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200 transition-all hover:-translate-y-1 hover:shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-navy-900">{upcoming[0].experience_title}</h3>
                <p className="mt-2 text-sm font-medium text-navy-500">
                  {formatDate(upcoming[0].time_slot.start_datetime)} at {formatTime(upcoming[0].time_slot.start_datetime)}
                </p>
              </div>
              <BookingStatusBadge status={upcoming[0].status} />
            </div>
          </Link>
        </div>
      )}

      <div className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-navy-900 mb-6">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/experiences"><Button variant="outline">Browse Experiences</Button></Link>
          <Link href="/dashboard/messages"><Button variant="outline">Messages</Button></Link>
          <Link href="/dashboard/profile"><Button variant="outline">Edit Profile</Button></Link>
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
