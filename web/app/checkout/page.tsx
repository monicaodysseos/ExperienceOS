"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, MapPin, Users, CreditCard, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api, type Booking } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatTime } from "@/lib/utils";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!ref) return;
    api
      .getBookingDetail(ref)
      .then(setBooking)
      .catch(() => toast.error("Failed to load booking"))
      .finally(() => setLoading(false));
  }, [ref]);

  const handlePay = async () => {
    if (!ref) return;
    setPaying(true);
    try {
      const { checkout_url } = await api.createCheckoutSession(ref);
      window.location.href = checkout_url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
      setPaying(false);
    }
  };

  const handleDirectConfirm = async () => {
    if (!ref) return;
    setConfirming(true);
    try {
      await api.directConfirmBooking(ref);
      toast.success("Booking confirmed!");
      router.push(`/bookings/${ref}?status=success`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm booking");
      setConfirming(false);
    }
  };

  if (!ref) {
    router.push("/experiences");
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-navy-900">Confirm & Pay</h1>
      <p className="mt-2 text-navy-500">Review your booking before payment</p>

      {loading ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : booking ? (
        <div className="mt-8 space-y-6">
          {/* Booking Summary */}
          <div className="rounded-xl border border-navy-200 p-6">
            <h2 className="text-lg font-semibold text-navy-900">
              {booking.experience_title}
            </h2>
            <div className="mt-4 space-y-3 text-sm text-navy-600">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-navy-400" />
                {formatDate(booking.time_slot.start_datetime)} at{" "}
                {formatTime(booking.time_slot.start_datetime)}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-navy-400" />
                {booking.experience_city}
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-navy-400" />
                {booking.num_participants} guest{booking.num_participants > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="rounded-xl border border-navy-200 p-6">
            <h3 className="font-semibold text-navy-900">Price breakdown</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-navy-600">
                <span>
                  &euro;{parseFloat(booking.unit_price).toFixed(2)} x{" "}
                  {booking.num_participants} guest{booking.num_participants > 1 ? "s" : ""}
                </span>
                <span>&euro;{parseFloat(booking.total_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-navy-600">
                <span>Service fee</span>
                <span>
                  &euro;{parseFloat(booking.participant_service_fee).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-navy-100 pt-2 text-base font-semibold text-navy-900">
                <span>Total</span>
                <span>&euro;{parseFloat(booking.total_charged).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePay}
            loading={paying}
            size="lg"
            className="w-full"
          >
            <CreditCard className="h-4 w-4" />
            Pay &euro;{parseFloat(booking.total_charged).toFixed(2)}
          </Button>

          <p className="text-center text-xs text-navy-400">
            You will be redirected to Stripe for secure payment
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-navy-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-navy-400">or</span>
            </div>
          </div>

          <Button
            onClick={handleDirectConfirm}
            loading={confirming}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Confirm without payment
          </Button>
        </div>
      ) : (
        <div className="mt-8 text-center text-navy-500">
          Booking not found
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <Suspense>
        <CheckoutContent />
      </Suspense>
    </AuthGuard>
  );
}
