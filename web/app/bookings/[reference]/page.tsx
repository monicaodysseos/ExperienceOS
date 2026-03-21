"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Users, ArrowLeft, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { api, type Booking } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatTime } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  confirmed: "success",
  pending: "warning",
  completed: "info",
  cancelled_by_participant: "error",
  cancelled_by_provider: "error",
};

function BookingDetailContent() {
  const { reference } = useParams<{ reference: string }>();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api
      .getBookingDetail(reference)
      .then(setBooking)
      .catch(() => toast.error("Failed to load booking"))
      .finally(() => setLoading(false));
  }, [reference]);

  useEffect(() => {
    if (status === "success") {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [status]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.cancelBooking(reference, "Cancelled by user");
      toast.success("Booking cancelled");
      const updated = await api.getBookingDetail(reference);
      setBooking(updated);
      setCancelOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  const hoursUntil = booking
    ? (new Date(booking.time_slot.start_datetime).getTime() - Date.now()) / 3600000
    : 0;

  const canCancel =
    booking &&
    (booking.status === "confirmed" || booking.status === "pending") &&
    hoursUntil > 0;

  const refundPercent = hoursUntil > 48 ? 100 : hoursUntil > 24 ? 50 : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/bookings"
        className="mb-6 flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      {/* Success Banner */}
      {status === "success" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Booking Confirmed!</p>
            <p className="text-sm text-emerald-700">
              Your experience is booked. Check your email for details.
            </p>
          </div>
        </div>
      )}

      {status === "cancelled" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800">
          <XCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Payment not completed</p>
            <p className="text-sm text-amber-700">
              Your booking is reserved. You can try paying again.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : booking ? (
        <>
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-navy-900">
              {booking.experience_title}
            </h1>
            <Badge variant={STATUS_VARIANTS[booking.status] || "default"}>
              {booking.status.replace(/_/g, " ")}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-navy-500">
            Ref: {booking.booking_reference}
          </p>

          <div className="mt-6 rounded-xl border border-navy-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm text-navy-600">
              <Calendar className="h-4 w-4 text-navy-400" />
              {formatDate(booking.time_slot.start_datetime)} at{" "}
              {formatTime(booking.time_slot.start_datetime)}
            </div>
            <div className="flex items-center gap-3 text-sm text-navy-600">
              <MapPin className="h-4 w-4 text-navy-400" />
              {booking.experience_city}
            </div>
            <div className="flex items-center gap-3 text-sm text-navy-600">
              <Users className="h-4 w-4 text-navy-400" />
              {booking.num_participants} guest{booking.num_participants > 1 ? "s" : ""}
            </div>
          </div>

          {/* Price */}
          <div className="mt-6 rounded-xl border border-navy-200 p-6">
            <h3 className="font-semibold text-navy-900">Price</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-navy-600">
                <span>Subtotal</span>
                <span>&euro;{parseFloat(booking.total_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-navy-600">
                <span>Service fee</span>
                <span>&euro;{parseFloat(booking.participant_service_fee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-navy-100 pt-2 font-semibold text-navy-900">
                <span>Total</span>
                <span>&euro;{parseFloat(booking.total_charged).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            {booking.status === "pending" && (
              <Link href={`/checkout?ref=${booking.booking_reference}`}>
                <Button>Complete Payment</Button>
              </Link>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                Cancel Booking
              </Button>
            )}
            {booking.status === "completed" && (
              <Link href={`/experiences/${booking.experience_slug}`}>
                <Button variant="outline">Leave a Review</Button>
              </Link>
            )}
          </div>

          {/* Cancel Modal */}
          <Modal open={cancelOpen} onOpenChange={setCancelOpen}>
            <ModalContent title="Cancel Booking" description="Are you sure you want to cancel?">
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  {refundPercent === 100
                    ? "You will receive a full refund."
                    : refundPercent === 50
                      ? "You will receive a 50% refund (less than 48h before start)."
                      : "No refund available (less than 24h before start)."}
                </p>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setCancelOpen(false)}>
                  Keep Booking
                </Button>
                <Button
                  variant="danger"
                  loading={cancelling}
                  onClick={handleCancel}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </ModalContent>
          </Modal>
        </>
      ) : (
        <p className="text-navy-500">Booking not found</p>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <AuthGuard>
      <Suspense>
        <BookingDetailContent />
      </Suspense>
    </AuthGuard>
  );
}
