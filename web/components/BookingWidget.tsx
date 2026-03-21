"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { api, type TimeSlot } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Calendar } from "./ui/Calendar";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";

interface BookingWidgetProps {
  slug: string;
  pricePerPerson: string;
  minParticipants: number;
  maxParticipants: number;
}

export function BookingWidget({
  slug,
  pricePerPerson,
  minParticipants,
  maxParticipants,
}: BookingWidgetProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [guests, setGuests] = useState(minParticipants || 1);

  const price = parseFloat(pricePerPerson);

  useEffect(() => {
    api
      .getTimeSlots(slug)
      .then((data) => setSlots(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const availableDates = slots
    .filter((s) => s.is_available && s.spots_remaining > 0)
    .map((s) => new Date(s.start_datetime));

  const slotsForDate = selectedDate
    ? slots.filter(
        (s) =>
          isSameDay(parseISO(s.start_datetime), selectedDate) &&
          s.is_available &&
          s.spots_remaining > 0
      )
    : [];

  const subtotal = price * guests;
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + serviceFee;

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/experiences/${slug}`);
      return;
    }

    if (!selectedSlot) {
      toast.error("Please select a date and time slot");
      return;
    }

    setBooking(true);
    try {
      const booking = await api.createBooking({
        time_slot_id: selectedSlot.id,
        num_participants: guests,
      });
      router.push(`/checkout?ref=${booking.booking_reference}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create booking"
      );
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="sticky top-24 rounded-2xl border border-navy-200 bg-white p-6 shadow-card">
      {/* Price */}
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-navy-900">
          &euro;{price.toFixed(0)}
        </span>
        <span className="text-navy-500">/ person</span>
      </div>

      {/* Calendar */}
      <div className="mt-5">
        <p className="text-sm font-medium text-navy-700">Select a date</p>
        {loading ? (
          <div className="mt-3 flex h-[280px] items-center justify-center rounded-xl bg-navy-50">
            <p className="text-sm text-navy-400">Loading availability...</p>
          </div>
        ) : availableDates.length === 0 ? (
          <div className="mt-3 rounded-xl bg-navy-50 p-6 text-center">
            <p className="text-sm text-navy-500">
              No available dates at the moment.
            </p>
            <p className="mt-1 text-xs text-navy-400">
              Check back soon for new time slots.
            </p>
          </div>
        ) : (
          <Calendar
            selected={selectedDate}
            onSelect={(date) => {
              if (date && !Array.isArray(date)) {
                setSelectedDate(date);
              } else if (!date) {
                setSelectedDate(undefined);
              }
              setSelectedSlot(null);
            }}
            availableDates={availableDates}
            className="mt-2"
          />
        )}
      </div>

      {/* Time Slots */}
      {slotsForDate.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-navy-700">Available times</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {slotsForDate.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  selectedSlot?.id === slot.id
                    ? "border-teal-700 bg-teal-50 text-teal-700"
                    : "border-navy-200 text-navy-600 hover:border-teal-300 hover:bg-teal-50"
                )}
              >
                {format(parseISO(slot.start_datetime), "HH:mm")}
                <span className="ml-1 text-xs text-navy-400">
                  ({slot.spots_remaining} left)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Guest Count */}
      {selectedSlot && (
        <div className="mt-4">
          <p className="text-sm font-medium text-navy-700">Guests</p>
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => setGuests(Math.max(minParticipants || 1, guests - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-50"
              disabled={guests <= (minParticipants || 1)}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-lg font-semibold text-navy-900 w-8 text-center">
              {guests}
            </span>
            <button
              onClick={() =>
                setGuests(
                  Math.min(
                    maxParticipants || 10,
                    selectedSlot.spots_remaining,
                    guests + 1
                  )
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-50"
              disabled={
                guests >= (maxParticipants || 10) ||
                guests >= selectedSlot.spots_remaining
              }
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      {selectedSlot && (
        <div className="mt-5 space-y-2 border-t border-navy-100 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-navy-600">
              &euro;{price.toFixed(0)} x {guests} guest{guests > 1 ? "s" : ""}
            </span>
            <span className="text-navy-900">&euro;{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-navy-600">Service fee</span>
            <span className="text-navy-900">&euro;{serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-navy-100 pt-2 font-semibold">
            <span className="text-navy-900">Total</span>
            <span className="text-navy-900">&euro;{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Book Button */}
      <Button
        onClick={handleBook}
        loading={booking}
        className="mt-5 w-full"
        size="lg"
        disabled={loading || (availableDates.length > 0 && !selectedSlot)}
      >
        {!isAuthenticated
          ? "Sign in to Book"
          : !selectedSlot
            ? "Select a date & time"
            : "Book Now"}
      </Button>

      {/* Trust */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-navy-400">
        <Shield className="h-3.5 w-3.5" />
        Free cancellation up to 48h before
      </div>
    </div>
  );
}
