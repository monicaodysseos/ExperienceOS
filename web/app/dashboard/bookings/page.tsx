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
      <h1 className="font-display text-3xl font-semibold text-navy-900">Team Bookings</h1>
      <p className="mt-1 text-navy-500">
        All experiences booked by your organisation
        {total > 0 && <span className="ml-1 text-navy-400">({total} total)</span>}
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by name or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="w-72"
          />
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam("status", opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-navy-900 text-white"
                  : "bg-white text-navy-600 ring-1 ring-sand-200 hover:bg-sand-50"
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
          <div className="space-y-3">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.booking_reference}`}
                className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-sand-200 transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-navy-900 truncate">{booking.experience_title}</p>
                    <span className="shrink-0 font-mono text-xs text-navy-400">{booking.booking_reference}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-navy-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-navy-400" />
                      {formatDate(booking.time_slot.start_datetime)} at {formatTime(booking.time_slot.start_datetime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-navy-400" />
                      {booking.experience_city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-navy-400" />
                      {booking.num_participants} person{booking.num_participants > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-4">
                  <span className="text-sm font-semibold text-navy-900">
                    €{parseFloat(booking.total_price).toFixed(2)}
                  </span>
                  <BookingStatusBadge status={booking.status} />
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
