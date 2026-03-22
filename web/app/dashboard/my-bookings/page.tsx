"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { api, type Booking } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatTime } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  confirmed: "success",
  pending: "warning",
  completed: "info",
  cancelled_by_participant: "error",
  cancelled_by_provider: "error",
  no_show: "error",
  refunded: "default",
};

function BookingList({ bookings, emptyMessage }: { bookings: Booking[]; emptyMessage: string }) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-7 w-7" />}
        title={emptyMessage}
        description="When you book an experience, it will appear here."
        action={{ label: "Browse Experiences", href: "/experiences" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Link
          key={booking.id}
          href={`/bookings/${booking.booking_reference}`}
          className="block rounded-[2rem] border-4 border-navy-900 bg-white p-6 transition-all shadow-playful hover:shadow-playful-hover hover:-translate-y-1"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-2xl font-black text-navy-900">{booking.experience_title}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-bold text-navy-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-navy-400" />
                  {formatDate(booking.time_slot.start_datetime)} at{" "}
                  {formatTime(booking.time_slot.start_datetime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-navy-400" />
                  {booking.experience_city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-navy-400" />
                  {booking.num_participants} guest{booking.num_participants > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="scale-110 origin-right">
                <Badge variant={STATUS_VARIANTS[booking.status] || "default"}>
                  {booking.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="mt-3 font-display text-2xl font-black text-navy-900 title-shadow">
                &euro;{parseFloat(booking.total_charged).toFixed(2)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMyBookings()
      .then((data) => setBookings(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => new Date(b.time_slot.start_datetime) >= now && !b.status.includes("cancelled")
  );
  const past = bookings.filter(
    (b) => new Date(b.time_slot.start_datetime) < now && !b.status.includes("cancelled")
  );
  const cancelled = bookings.filter((b) => b.status.includes("cancelled"));

  return (
    <div>
      <h1 className="font-display text-4xl font-black text-navy-900 title-shadow">My Bookings</h1>
      <p className="mt-2 text-lg font-bold text-navy-500">Manage your upcoming and past experiences</p>

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="upcoming" className="mt-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            <BookingList bookings={upcoming} emptyMessage="No upcoming bookings" />
          </TabsContent>
          <TabsContent value="past">
            <BookingList bookings={past} emptyMessage="No past bookings yet" />
          </TabsContent>
          <TabsContent value="cancelled">
            <BookingList bookings={cancelled} emptyMessage="No cancelled bookings" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
