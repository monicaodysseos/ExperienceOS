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
  Users,
  Wallet,
  Vote,
} from "lucide-react";
import { api, type Booking, type OrgDashboard, type Department, type DeptHeadDashboard as DeptHeadDashboardData } from "@/lib/api";
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
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-navy-900 ">
            Ready to spark some creativity, {user?.first_name}? <span style={{ textShadow: "none" }}>✨</span>
          </h1>
          {dashboard?.org && (
            <p className="mt-3 text-xl font-bold text-navy-700 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-purple-500" />
              {dashboard.org.name}
            </p>
          )}
        </div>
        <Link href="/experiences" className="mt-2 sm:mt-0 ml-4 flex-shrink-0">
          <Button size="lg" className="rounded-[1.5rem] px-6 border-4 border-navy-900 shadow-playful hover:-translate-y-1 hover:shadow-playful-hover transition-all bg-blue-400 text-navy-900 font-bold">
            <Plus className="h-5 w-5 mr-1 border-2 border-navy-900 rounded-full" />
            Book Experience
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-10">
        <HRDashboardStats data={dashboard} loading={loading} />
      </div>

      {/* Department budget overview */}
      {!loading && dashboard?.departments && dashboard.departments.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-3xl font-bold text-navy-900">Departments</h2>
            <Link
              href="/dashboard/team"
              className="flex items-center gap-2 text-base font-bold text-navy-700 hover:text-navy-900 bg-white px-4 py-2 border-2 border-navy-900 rounded-full shadow-sm transition-colors"
            >
              Manage <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {dashboard.departments.map((dept: Department) => {
              const total = parseFloat(dept.budget_total);
              const spent = parseFloat(dept.budget_spent);
              const pct = total > 0 ? (spent / total) * 100 : 0;
              return (
                <div key={dept.id} className="rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-navy-900">{dept.name}</h3>
                    <span className="text-sm font-bold text-navy-500">
                      {dept.member_count} member{dept.member_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {dept.head_detail && (
                    <p className="text-sm text-navy-500 mb-3">
                      Head: {dept.head_detail.first_name} {dept.head_detail.last_name}
                    </p>
                  )}
                  {total > 0 && (
                    <>
                      <div className="h-3 rounded-full bg-navy-100 border border-navy-200 overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${pct > 90 ? "bg-red-400" : pct > 70 ? "bg-orange-400" : "bg-green-400"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-medium text-navy-500">
                        <span>€{spent.toFixed(0)} spent</span>
                        <span>€{total.toFixed(0)} budget ({pct.toFixed(0)}%)</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No org yet */}
      {!loading && !dashboard?.org?.id && (
        <div className="mt-12 rounded-[2.5rem] border-4 border-navy-900 bg-orange-400 p-10 text-center shadow-playful blob-shape-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 blur-xl pointer-events-none"></div>
          <Building2 className="mx-auto h-16 w-16 text-navy-900 mb-6 relative z-10" />
          <h3 className="font-display text-4xl font-bold text-navy-900  relative z-10">
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
            <h2 className="font-display text-3xl font-bold text-navy-900 ">
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
                  <span className="text-xl font-bold text-navy-900 ">
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
      <h1 className="font-display text-5xl sm:text-6xl font-bold text-navy-900 ">
        Ready for some fun, {user?.first_name}? <span style={{ textShadow: "none" }}>🎨</span>
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
              <p className="font-display text-5xl font-bold text-navy-900 ">{upcoming.length}</p>
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
              <p className="font-display text-5xl font-bold text-navy-900 ">{unread}</p>
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
              <p className="font-display text-3xl font-bold text-navy-900  leading-tight">Become a Provider</p>
              <p className="mt-2 text-lg font-bold text-navy-900">Start hosting experiences</p>
            </div>
          </Link>
        )}
      </div>

      {upcoming.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold text-navy-900 ">Your Next Experience</h2>
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
        <h2 className="font-display text-4xl font-bold text-navy-900 mb-8 ">Quick Actions</h2>
        <div className="flex flex-wrap gap-4 relative z-10">
          <Link href="/experiences"><Button variant="outline" size="lg">Browse Experiences</Button></Link>
          <Link href="/dashboard/messages"><Button variant="primary" size="lg">Messages</Button></Link>
          <Link href="/dashboard/profile"><Button variant="secondary" size="lg">Edit Profile</Button></Link>
        </div>
      </div>
    </div>
  );
}

// ─── Dept Head Dashboard ──────────────────────────────────────────────────────

function DeptHeadDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DeptHeadDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDeptHeadDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="font-display text-5xl sm:text-6xl font-bold text-navy-900">
        Welcome back, {user?.first_name}! <span style={{ textShadow: "none" }}>🏢</span>
      </h1>
      <p className="mt-4 text-xl font-bold text-navy-700">Manage your department&apos;s team activities</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-4">
        <div className="rounded-[2.5rem] bg-green-300 p-8 border-4 border-navy-900 shadow-playful">
          <Wallet className="h-8 w-8 text-navy-900 mb-4" />
          {loading ? (
            <Skeleton className="h-12 w-24 rounded-lg bg-navy-900/10" />
          ) : (
            <p className="font-display text-4xl font-bold text-navy-900">
              €{parseFloat(data?.total_remaining || '0').toFixed(0)}
            </p>
          )}
          <p className="mt-2 text-base font-bold text-navy-900">Budget Remaining</p>
        </div>

        <div className="rounded-[2.5rem] bg-blue-300 p-8 border-4 border-navy-900 shadow-playful">
          <Users className="h-8 w-8 text-navy-900 mb-4" />
          {loading ? (
            <Skeleton className="h-12 w-16 rounded-lg bg-navy-900/10" />
          ) : (
            <p className="font-display text-4xl font-bold text-navy-900">{data?.team_count || 0}</p>
          )}
          <p className="mt-2 text-base font-bold text-navy-900">Teams</p>
        </div>

        <div className="rounded-[2.5rem] bg-orange-300 p-8 border-4 border-navy-900 shadow-playful">
          <Users className="h-8 w-8 text-navy-900 mb-4" />
          {loading ? (
            <Skeleton className="h-12 w-16 rounded-lg bg-navy-900/10" />
          ) : (
            <p className="font-display text-4xl font-bold text-navy-900">{data?.member_count || 0}</p>
          )}
          <p className="mt-2 text-base font-bold text-navy-900">Team Members</p>
        </div>

        <div className="rounded-[2.5rem] bg-purple-300 p-8 border-4 border-navy-900 shadow-playful">
          <Vote className="h-8 w-8 text-navy-900 mb-4" />
          {loading ? (
            <Skeleton className="h-12 w-16 rounded-lg bg-navy-900/10" />
          ) : (
            <p className="font-display text-4xl font-bold text-navy-900">{data?.active_polls || 0}</p>
          )}
          <p className="mt-2 text-base font-bold text-navy-900">Active Polls</p>
        </div>
      </div>

      {/* Budget per department */}
      {!loading && data && data.departments.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-3xl font-bold text-navy-900 mb-6">Budget Overview</h2>
          <div className="space-y-4">
            {data.departments.map((dept) => {
              const pct = parseFloat(dept.budget_total) > 0
                ? (parseFloat(dept.budget_spent) / parseFloat(dept.budget_total)) * 100
                : 0;
              return (
                <div key={dept.id} className="rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-navy-900">{dept.name}</h3>
                    <span className="text-lg font-bold text-navy-900">
                      €{parseFloat(dept.budget_remaining).toFixed(0)} remaining
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-navy-100 border-2 border-navy-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-navy-500">
                    €{parseFloat(dept.budget_spent).toFixed(0)} of €{parseFloat(dept.budget_total).toFixed(0)} used ({pct.toFixed(0)}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/dashboard/teams"><Button variant="primary" size="lg">Manage Teams</Button></Link>
        <Link href="/dashboard/budget"><Button variant="outline" size="lg">View Budget</Button></Link>
        <Link href="/experiences"><Button variant="secondary" size="lg">Browse Experiences</Button></Link>
      </div>

      {/* Recent Bookings */}
      {!loading && data && data.recent_bookings.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-3xl font-bold text-navy-900 mb-6">Recent Bookings</h2>
          <div className="space-y-4">
            {data.recent_bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful">
                <div>
                  <p className="font-bold text-xl text-navy-900">{booking.experience_title}</p>
                  <p className="mt-1 text-base font-medium text-navy-600">
                    {formatDate(booking.time_slot.start_datetime)} · {booking.num_participants} person{booking.num_participants > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-navy-900">€{parseFloat(booking.total_price).toFixed(0)}</span>
                  <BookingStatusBadge status={booking.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Employee Dashboard ──────────────────────────────────────────────────────

function EmployeeDashboard() {
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
      <h1 className="font-display text-5xl sm:text-6xl font-bold text-navy-900">
        Hey {user?.first_name}! <span style={{ textShadow: "none" }}>👋</span>
      </h1>
      <p className="mt-4 text-xl font-bold text-navy-700">Check out what your team is up to</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <Link href="/dashboard/my-team" className="rounded-[2.5rem] bg-blue-300 p-8 border-4 border-navy-900 shadow-playful transition-transform hover:-translate-y-2 hover:shadow-playful-hover">
          <Users className="h-8 w-8 text-navy-900 mb-4" />
          <p className="font-display text-3xl font-bold text-navy-900">My Team</p>
          <p className="mt-2 text-base font-bold text-navy-900">See teammates & activity</p>
        </Link>

        <Link href="/dashboard/suggestions" className="rounded-[2.5rem] bg-orange-300 p-8 border-4 border-navy-900 shadow-playful transition-transform hover:-translate-y-2 hover:shadow-playful-hover">
          <Sparkles className="h-8 w-8 text-navy-900 mb-4" />
          <p className="font-display text-3xl font-bold text-navy-900">Suggestions</p>
          <p className="mt-2 text-base font-bold text-navy-900">Suggest & vote on experiences</p>
        </Link>

        <Link href="/dashboard/polls" className="rounded-[2.5rem] bg-purple-300 p-8 border-4 border-navy-900 shadow-playful transition-transform hover:-translate-y-2 hover:shadow-playful-hover">
          <Vote className="h-8 w-8 text-navy-900 mb-4" />
          <p className="font-display text-3xl font-bold text-navy-900">Polls</p>
          <p className="mt-2 text-base font-bold text-navy-900">Vote on team activities</p>
        </Link>
      </div>

      {/* Upcoming bookings */}
      {upcoming.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-3xl font-bold text-navy-900 mb-6">Upcoming</h2>
          {upcoming.map((b) => (
            <div key={b.id} className="rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful mb-4">
              <p className="font-bold text-xl text-navy-900">{b.experience_title}</p>
              <p className="mt-1 text-base text-navy-600">{formatDate(b.time_slot.start_datetime)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {!loading && unread > 0 && (
        <Link href="/dashboard/messages" className="mt-8 flex items-center gap-4 rounded-[2rem] bg-yellow-400 p-6 border-4 border-navy-900 shadow-playful transition-transform hover:-translate-y-1 hover:shadow-playful-hover">
          <MessageSquare className="h-6 w-6 text-navy-900" />
          <span className="font-bold text-lg text-navy-900">You have {unread} unread message{unread > 1 ? 's' : ''}</span>
          <ArrowRight className="h-5 w-5 text-navy-900 ml-auto" />
        </Link>
      )}
    </div>
  );
}

// ─── Route ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "hr_manager") return <HRDashboard />;
  if (user?.role === "dept_head") return <DeptHeadDashboard />;
  if (user?.role === "employee") return <EmployeeDashboard />;
  return <ParticipantDashboard />;
}
