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
      <h1 className="text-2xl font-bold text-navy-900">Incoming Bookings</h1>
      <p className="mt-1 text-navy-500">Bookings from your guests</p>

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
        <div className="mt-6 space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-navy-200 bg-white p-5"
            >
              <div>
                <h3 className="font-semibold text-navy-900">
                  {b.experience_title}
                </h3>
                <div className="mt-1 flex items-center gap-4 text-sm text-navy-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(b.time_slot.start_datetime)} at{" "}
                    {formatTime(b.time_slot.start_datetime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {b.num_participants} guest{b.num_participants > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={STATUS_VARIANTS[b.status] || "default"}>
                  {b.status.replace(/_/g, " ")}
                </Badge>
                <p className="mt-1 text-sm font-semibold text-navy-900">
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
