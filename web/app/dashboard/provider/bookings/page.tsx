"use client";

import { useEffect, useState } from "react";
import { Calendar, Users } from "lucide-react";
import { api, type Booking } from "@/lib/api";
import { ProviderGuard } from "@/components/ProviderGuard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatTime } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "error" | "default"> = {
  confirmed: "success",
  pending: "warning",
  completed: "default",
  cancelled_by_participant: "error",
  cancelled_by_provider: "error",
};

function ProviderBookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProviderBookings()
      .then((d) => setBookings(d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl font-black text-navy-900 title-shadow">Incoming Bookings</h1>
      <p className="mt-2 text-lg font-bold text-navy-500">Bookings from your guests</p>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No bookings yet"
          description="When guests book your experiences, they will appear here."
          className="mt-8"
        />
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[2rem] border-4 border-navy-900 bg-white p-6 shadow-playful hover:shadow-playful-hover hover:-translate-y-1 transition-all"
            >
              <div>
                <h3 className="font-display text-2xl font-black text-navy-900">
                  {b.experience_title}
                </h3>
                <div className="mt-3 flex items-center gap-4 text-sm font-bold text-navy-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    {formatDate(b.time_slot.start_datetime)} at{" "}
                    {formatTime(b.time_slot.start_datetime)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    {b.num_participants} guest{b.num_participants > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="text-right sm:text-right">
                <div className="scale-110 origin-left sm:origin-right mb-2">
                  <Badge variant={STATUS_VARIANTS[b.status] || "default"}>
                    {b.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-3 font-display text-2xl font-black text-navy-900 title-shadow">
                  &euro;{parseFloat(b.total_price).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProviderBookingsPage() {
  return (
    <ProviderGuard>
      <ProviderBookingsContent />
    </ProviderGuard>
  );
}
