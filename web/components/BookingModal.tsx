"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Shield,
  Minus,
  Plus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format, isSameDay, parseISO } from "date-fns";
import { api, type TimeSlot } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import * as Dialog from "@radix-ui/react-dialog";
import { Calendar as CalendarPicker } from "./ui/Calendar";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  pricePerPerson: string;
  minParticipants: number;
  maxParticipants: number;
}

type Step = "date" | "group" | "notes" | "review";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "date", label: "Date & time", icon: <Calendar className="h-4 w-4" /> },
  { key: "group", label: "Group size", icon: <Users className="h-4 w-4" /> },
  { key: "notes", label: "Notes", icon: <FileText className="h-4 w-4" /> },
  { key: "review", label: "Review", icon: <CreditCard className="h-4 w-4" /> },
];

export function BookingModal({
  open,
  onClose,
  slug,
  title,
  pricePerPerson,
  minParticipants,
  maxParticipants,
}: BookingModalProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>("date");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [guests, setGuests] = useState(minParticipants || 2);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  const price = parseFloat(pricePerPerson);
  const subtotal = price * guests;
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + serviceFee;

  useEffect(() => {
    if (!open) return;
    setSlotsLoading(true);
    api
      .getTimeSlots(slug)
      .then((data) => setSlots(data.results || []))
      .catch(() => {})
      .finally(() => setSlotsLoading(false));
  }, [open, slug]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("date");
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setGuests(minParticipants || 2);
      setNotes("");
    }
  }, [open, minParticipants]);

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

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canNext =
    step === "date" ? !!selectedSlot :
    step === "group" ? guests >= (minParticipants || 1) :
    step === "notes" ? true :
    false;

  const next = () => {
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setStep(nextStep.key);
  };

  const back = () => {
    const prevStep = STEPS[stepIndex - 1];
    if (prevStep) setStep(prevStep.key);
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      onClose();
      router.push(`/auth/login?redirect=/experiences/${slug}`);
      return;
    }
    if (!selectedSlot) return;

    setBooking(true);
    try {
      const result = await api.createBooking({
        time_slot_id: selectedSlot.id,
        num_participants: guests,
        special_requests: notes,
      });
      onClose();
      router.push(`/checkout?ref=${result.booking_reference}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setBooking(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl focus:outline-none">
    <div className="max-w-lg">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-0">
        <div>
          <h2 className="font-display text-xl font-semibold text-navy-900">Book experience</h2>
          <p className="mt-0.5 text-sm text-navy-500 truncate max-w-xs">{title}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-navy-400 hover:text-navy-700 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="px-6 pt-5">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1">
              <button
                onClick={() => i < stepIndex && setStep(s.key)}
                disabled={i > stepIndex}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  i < stepIndex
                    ? "bg-emerald-500 text-white cursor-pointer"
                    : i === stepIndex
                    ? "bg-navy-900 text-white"
                    : "bg-sand-100 text-navy-400"
                )}
              >
                {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px flex-1 w-8", i < stepIndex ? "bg-emerald-300" : "bg-sand-200")} />
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs font-medium text-navy-400">
          Step {stepIndex + 1} of {STEPS.length} — {STEPS[stepIndex].label}
        </p>
      </div>

      {/* Step content */}
      <div className="p-6 min-h-[280px]">

        {/* Step 1: Date & time */}
        {step === "date" && (
          <div>
            {slotsLoading ? (
              <div className="flex h-[220px] items-center justify-center rounded-xl bg-sand-50">
                <p className="text-sm text-navy-400">Loading availability…</p>
              </div>
            ) : availableDates.length === 0 ? (
              <div className="flex h-[220px] flex-col items-center justify-center rounded-xl bg-sand-50 text-center px-8">
                <Calendar className="h-8 w-8 text-navy-300 mb-3" />
                <p className="font-medium text-navy-700">No available dates</p>
                <p className="mt-1 text-sm text-navy-400">Check back soon for new slots.</p>
              </div>
            ) : (
              <>
                <CalendarPicker
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d && !Array.isArray(d)) {
                      setSelectedDate(d);
                      setSelectedSlot(null);
                    }
                  }}
                  availableDates={availableDates}
                />
                {slotsForDate.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-navy-700 mb-2">Available times</p>
                    <div className="flex flex-wrap gap-2">
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
              </>
            )}
          </div>
        )}

        {/* Step 2: Group size */}
        {step === "group" && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-6">
            <p className="text-sm font-medium text-navy-700">How many people?</p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setGuests(Math.max(minParticipants || 1, guests - 1))}
                disabled={guests <= (minParticipants || 1)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-5xl font-semibold text-navy-900 w-16 text-center">{guests}</span>
              <button
                onClick={() => setGuests(Math.min(
                  maxParticipants || 200,
                  selectedSlot?.spots_remaining ?? (maxParticipants || 200),
                  guests + 1
                ))}
                disabled={guests >= (maxParticipants || 200) || guests >= (selectedSlot?.spots_remaining ?? Infinity)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-navy-400">
              Min {minParticipants} · Max {maxParticipants || "unlimited"}
            </p>
            <div className="w-full rounded-xl bg-sand-50 p-4 text-sm text-navy-700">
              <div className="flex justify-between">
                <span>€{price.toFixed(0)} × {guests} people</span>
                <span className="font-semibold">€{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Notes */}
        {step === "notes" && (
          <div>
            <p className="text-sm font-medium text-navy-700 mb-2">
              Any notes for the provider? <span className="font-normal text-navy-400">(optional)</span>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. dietary requirements, accessibility needs, preferred time…"
              rows={5}
              className="w-full rounded-xl border border-navy-200 px-4 py-3 text-sm text-navy-900 placeholder-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>
        )}

        {/* Step 4: Review */}
        {step === "review" && selectedSlot && (
          <div className="space-y-4">
            <div className="rounded-xl bg-sand-50 p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-navy-500">Experience</span>
                <span className="font-medium text-navy-900 text-right max-w-[180px] truncate">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Date & time</span>
                <span className="font-medium text-navy-900">
                  {format(parseISO(selectedSlot.start_datetime), "d MMM yyyy, HH:mm")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Group size</span>
                <span className="font-medium text-navy-900">{guests} people</span>
              </div>
              {notes && (
                <div className="flex justify-between">
                  <span className="text-navy-500">Notes</span>
                  <span className="font-medium text-navy-900 text-right max-w-[180px]">{notes}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white ring-1 ring-sand-200 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-navy-500">€{price.toFixed(0)} × {guests} people</span>
                <span className="text-navy-900">€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Service fee</span>
                <span className="text-navy-900">€{serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-sand-100 pt-2 font-semibold">
                <span className="text-navy-900">Total</span>
                <span className="text-navy-900">€{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-navy-400">
              <Shield className="h-3.5 w-3.5" />
              Free cancellation up to 48h before the experience
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t border-sand-100 px-6 py-4">
        <button
          onClick={stepIndex === 0 ? onClose : back}
          className="flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {stepIndex === 0 ? "Cancel" : "Back"}
        </button>

        {step !== "review" ? (
          <Button onClick={next} disabled={!canNext} size="sm">
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleBook} loading={booking} size="sm">
            {isAuthenticated ? "Confirm & Pay" : "Sign in to Book"}
          </Button>
        )}
        </div>
      </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
