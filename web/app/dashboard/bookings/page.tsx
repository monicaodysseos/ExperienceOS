"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, MapPin, Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { api, type Booking } from "@/lib/api";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatTime } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled_by_participant", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const searchQuery = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getOrgBookings({
        status: statusFilter || undefined,
        q: searchQuery || undefined,
        page,
      })
      .then((data) => {
        setBookings(data.results || []);
        setTotal(data.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    load();
  }, [load]);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.push(`/dashboard/bookings?${p.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setParam("q", search);
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="font-display text-4xl font-bold text-navy-900 title-shadow">Team Bookings</h1>
      <p className="mt-2 text-lg font-bold text-navy-500">
        Your previously scheduled experiences
        {total > 0 && <span className="ml-2 text-navy-400">({total} total)</span>}
      </p>

      {/* Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by name or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-5 w-5" />}
            className="w-full sm:w-80 border-4 border-navy-900 rounded-full"
          />
          <Button type="submit" size="lg" className="rounded-full border-4 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] bg-orange-400 text-navy-900 font-bold hover:-translate-y-0.5 transition-transform">
            Search
          </Button>
        </form>

        <div className="flex gap-2 flex-wrap sm:justify-end">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam("status", opt.value)}
              className={`rounded-full px-4 py-2 text-sm font-bold border-4 transition-all ${
                statusFilter === opt.value
                  ? "bg-blue-400 border-navy-900 text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] -translate-y-0.5"
                  : "bg-white border-transparent text-navy-600 hover:border-navy-200 hover:bg-sand-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-7 w-7" />}
            title="No bookings found"
            description={statusFilter || searchQuery ? "Try adjusting your filters." : "When your team books experiences, they'll appear here."}
            action={{ label: "Browse Experiences", href: "/experiences" }}
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.booking_reference}`}
                className="flex items-center justify-between rounded-[2rem] border-4 border-navy-900 bg-white p-6 shadow-playful transition-all hover:-translate-y-1 hover:shadow-playful-hover"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-display text-2xl font-bold text-navy-900 truncate">{booking.experience_title}</p>
                    <span className="shrink-0 font-mono text-xs font-bold text-navy-400 bg-sand-100 px-2 py-1 rounded-full">{booking.booking_reference}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-bold text-navy-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      {formatDate(booking.time_slot.start_datetime)} at {formatTime(booking.time_slot.start_datetime)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      {booking.experience_city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-500" />
                      {booking.num_participants} person{booking.num_participants > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="ml-6 flex shrink-0 items-center gap-6">
                  <span className="font-display text-2xl font-bold text-navy-900 title-shadow">
                    €{parseFloat(booking.total_price).toFixed(2)}
                  </span>
                  <div className="scale-110 origin-right">
                    <BookingStatusBadge status={booking.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-navy-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setParam("page", String(page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setParam("page", String(page + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardBookingsPage() {
  return (
    <Suspense>
      <BookingsContent />
    </Suspense>
  );
}
