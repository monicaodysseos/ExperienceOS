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
        href="/dashboard/my-bookings"
        className="flex items-center gap-2 mb-8 text-base font-black text-navy-900 hover:-translate-x-1 transition-transform"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to bookings
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-mono text-sm font-bold text-navy-400">{booking.booking_reference}</p>
          <h1 className="font-display text-4xl font-black text-navy-900 mt-2 title-shadow">
            {booking.experience_title}
          </h1>
        </div>
        <div className="scale-125 origin-right mt-4">
          <BookingStatusBadge status={booking.status} className="text-sm px-3 py-1" />
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-[2.5rem] bg-white p-8 shadow-playful border-4 border-navy-900 space-y-6 blob-shape-2 relative">
        <div className="grid grid-cols-2 gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-navy-900 bg-yellow-400 text-navy-900 shadow-sm">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-navy-500 uppercase tracking-wide">Date</p>
              <p className="mt-1 font-bold text-navy-900">
                {formatDate(booking.time_slot.start_datetime)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-navy-900 bg-purple-400 text-navy-900 shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-navy-500 uppercase tracking-wide">Time</p>
              <p className="mt-1 font-bold text-navy-900">
                {formatTime(booking.time_slot.start_datetime)} → {formatTime(booking.time_slot.end_datetime)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-navy-900 bg-orange-400 text-navy-900 shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-navy-500 uppercase tracking-wide">Location</p>
              <p className="mt-1 font-bold text-navy-900">{booking.experience_city}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-navy-900 bg-light-green-400 text-navy-900 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-navy-500 uppercase tracking-wide">Group size</p>
              <p className="mt-1 font-bold text-navy-900">
                {booking.num_participants} person{booking.num_participants > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {booking.special_requests && (
          <div className="border-t-[3px] border-navy-900/20 pt-6 relative z-10">
            <p className="text-xs font-black text-navy-500 uppercase tracking-wide mb-2">Notes</p>
            <p className="text-base font-bold text-navy-900">{booking.special_requests}</p>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="mt-8 rounded-[2.5rem] bg-yellow-400 p-8 shadow-playful border-4 border-navy-900">
        <h2 className="font-display text-2xl font-black text-navy-900 mb-6 title-shadow">Price breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-base font-bold">
            <span className="text-navy-900">
              €{parseFloat(booking.unit_price).toFixed(2)} × {booking.num_participants} person{booking.num_participants > 1 ? "s" : ""}
            </span>
            <span className="text-navy-900">&euro;{parseFloat(booking.total_price).toFixed(2)}</span>
          </div>
          {parseFloat(booking.participant_service_fee) > 0 && (
            <div className="flex justify-between text-base font-bold">
              <span className="text-navy-900">Service fee</span>
              <span className="text-navy-900">&euro;{parseFloat(booking.participant_service_fee).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-navy-900/20 pt-4 mt-2 font-semibold">
            <span className="text-lg font-black text-navy-900 mt-1">Total charged</span>
            <span className="font-display text-3xl font-black text-navy-900 title-shadow">&euro;{totalCharged.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href={`/experiences/${booking.experience_slug}`} target="_blank">
          <Button size="lg" className="rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-white text-navy-900 font-black hover:-translate-y-1 transition-all">
            <ExternalLink className="h-5 w-5 mr-2" />
            View Experience
          </Button>
        </Link>
        <Button size="lg" className="rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-blue-400 text-navy-900 font-black" disabled>
          <FileText className="h-5 w-5 mr-2" />
          Download Invoice
          <span className="ml-1 text-xs text-navy-900/60 font-bold">(coming soon)</span>
        </Button>
        {canCancel && (
          <Link href={`/bookings/${booking.booking_reference}`}>
            <Button size="lg" className="rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-orange-400 text-navy-900 font-black hover:-translate-y-1 transition-all">
              Cancel Booking
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
