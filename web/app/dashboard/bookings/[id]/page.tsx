"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  ExternalLink,
  FileText,
} from "lucide-react";
import { api, type Booking } from "@/lib/api";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: Props) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .getBookingDetail(id)
      .then(setBooking)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center">
        <p className="text-navy-500">Booking not found.</p>
        <Link href="/dashboard/bookings" className="mt-4 inline-block text-sm font-medium text-crimson-600 hover:text-crimson-700">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  const totalCharged = parseFloat(booking.total_price) + parseFloat(booking.participant_service_fee);
  const canCancel = booking.status === "confirmed" || booking.status === "pending";

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link
        href="/dashboard/bookings"
        className="flex items-center gap-2 text-sm font-medium text-navy-500 hover:text-crimson-600 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="font-mono text-sm text-navy-400">{booking.booking_reference}</p>
          <h1 className="font-display text-3xl font-semibold text-navy-900 mt-1">
            {booking.experience_title}
          </h1>
        </div>
        <BookingStatusBadge status={booking.status} className="text-sm px-3 py-1" />
      </div>

      {/* Details card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-navy-400 uppercase tracking-wide">Date</p>
              <p className="mt-0.5 font-medium text-navy-900">
                {formatDate(booking.time_slot.start_datetime)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-navy-400 uppercase tracking-wide">Time</p>
              <p className="mt-0.5 font-medium text-navy-900">
                {formatTime(booking.time_slot.start_datetime)} → {formatTime(booking.time_slot.end_datetime)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-navy-400 uppercase tracking-wide">Location</p>
              <p className="mt-0.5 font-medium text-navy-900">{booking.experience_city}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-navy-400 uppercase tracking-wide">Group size</p>
              <p className="mt-0.5 font-medium text-navy-900">
                {booking.num_participants} person{booking.num_participants > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {booking.special_requests && (
          <div className="border-t border-sand-100 pt-4">
            <p className="text-xs font-medium text-navy-400 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-navy-700">{booking.special_requests}</p>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200">
        <h2 className="font-semibold text-navy-900 mb-4">Price breakdown</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-navy-600">
              €{parseFloat(booking.unit_price).toFixed(2)} × {booking.num_participants} person{booking.num_participants > 1 ? "s" : ""}
            </span>
            <span className="text-navy-900">&euro;{parseFloat(booking.total_price).toFixed(2)}</span>
          </div>
          {parseFloat(booking.participant_service_fee) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-navy-600">Service fee</span>
              <span className="text-navy-900">&euro;{parseFloat(booking.participant_service_fee).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-sand-100 pt-2 font-semibold">
            <span className="text-navy-900">Total charged</span>
            <span className="text-navy-900">&euro;{totalCharged.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/experiences/${booking.experience_slug}`} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-1.5" />
            View Experience
          </Button>
        </Link>
        <Button variant="outline" size="sm" disabled>
          <FileText className="h-4 w-4 mr-1.5" />
          Download Invoice
          <span className="ml-1 text-xs text-navy-400">(coming soon)</span>
        </Button>
        {canCancel && (
          <Link href={`/bookings/${booking.booking_reference}`}>
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
              Cancel Booking
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
