"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, type TimeSlot } from "@/lib/api";
import { ProviderGuard } from "@/components/ProviderGuard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Calendar } from "@/components/ui/Calendar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { format, parseISO, isSameDay } from "date-fns";

function TimeSlotsContent() {
  const { slug } = useParams<{ slug: string }>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [viewDate, setViewDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [spotsTotal, setSpotsTotal] = useState("10");
  const [creating, setCreating] = useState(false);

  const loadSlots = () => {
    api
      .getTimeSlots(slug)
      .then((d) => setSlots(d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSlots();
  }, [slug]);

  const slotsForDate = viewDate
    ? slots.filter((s) => isSameDay(parseISO(s.start_datetime), viewDate))
    : [];

  const datesWithSlots = slots.map((s) => new Date(s.start_datetime));

  const removeDate = (date: Date) => {
    setSelectedDates(prev => prev.filter(d => !isSameDay(d, date)));
  };

  const handleBulkCreate = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date");
      return;
    }
    setCreating(true);
    try {
      for (const date of selectedDates) {
        const dateStr = format(date, "yyyy-MM-dd");
        await api.createTimeSlot(slug, {
          start_datetime: `${dateStr}T${startTime}:00`,
          end_datetime: `${dateStr}T${endTime}:00`,
          spots_total: parseInt(spotsTotal),
        });
      }
      toast.success(`${selectedDates.length} time slot${selectedDates.length > 1 ? 's' : ''} created`);
      setSelectedDates([]);
      loadSlots();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create slots");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (slotId: number) => {
    try {
      await api.deleteTimeSlot(slug, slotId);
      toast.success("Slot deleted");
      setSlots(slots.filter((s) => s.id !== slotId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <Link
        href="/dashboard/provider/experiences"
        className="mb-8 flex items-center gap-2 text-base font-bold text-navy-900 hover:-translate-x-1 transition-transform"
      >
        <ArrowLeft className="h-5 w-5" /> Back to experiences
      </Link>

      <h1 className="font-display text-4xl font-bold text-navy-900 title-shadow">Manage Time Slots</h1>
      <p className="mt-2 text-lg font-bold text-navy-500">
        Select a date to view or add time slots
      </p>

      {loading ? (
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          {/* Calendar for date selection */}
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border-4 border-navy-900 bg-white p-8 shadow-playful relative blob-shape-3">
              <h3 className="mb-4 font-display text-2xl font-bold text-navy-900 title-shadow relative z-10">
                Select Dates for Time Slots
              </h3>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => {
                  if (dates && Array.isArray(dates)) {
                    setSelectedDates(dates);
                    setViewDate(dates[dates.length - 1]);
                  }
                }}
                markedDates={datesWithSlots}
              />
              <p className="mt-4 text-sm font-bold text-navy-500 relative z-10">
                Click dates to select them for bulk time slot creation
              </p>
            </div>

            {/* View existing slots for date */}
            {viewDate && (
              <div className="rounded-[2.5rem] border-4 border-navy-900 bg-yellow-400 p-8 shadow-playful relative">
                <h3 className="mb-4 font-display text-xl font-bold text-navy-900 title-shadow">
                  Existing Slots: {format(viewDate, "MMM d")}
                </h3>
                <div className="space-y-3">
                  {slotsForDate.length === 0 ? (
                    <p className="text-sm font-bold text-navy-500 py-2 bg-white/50 rounded-xl px-4 inline-block">
                      No slots for this date yet
                    </p>
                  ) : (
                    slotsForDate.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-2xl border-4 border-navy-900 bg-white p-4 shadow-[4px_4px_0_theme(colors.navy.900)] -translate-x-1 -translate-y-1 hover:translate-x-0 hover:translate-y-0 hover:shadow-none transition-all"
                      >
                        <div>
                          <p className="text-base font-bold text-navy-900">
                            {format(parseISO(slot.start_datetime), "HH:mm")} -{" "}
                            {format(parseISO(slot.end_datetime), "HH:mm")}
                          </p>
                          <p className="text-sm font-bold text-navy-500 mt-0.5">
                            {slot.spots_remaining}/{slot.spots_total} left
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-navy-900 bg-red-400 text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] hover:-translate-y-0.5 transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Create time slots form */}
          <div className="rounded-[2.5rem] border-4 border-navy-900 bg-white p-8 shadow-playful relative blob-shape-2">
            <h3 className="font-display text-2xl font-bold text-navy-900 title-shadow relative z-10">
              Create Time Slots
            </h3>
            <p className="mt-2 text-base font-bold text-navy-500 relative z-10">
              Select dates on the calendar, then set the time and capacity
            </p>

            {/* Selected dates chips */}
            {selectedDates.length > 0 && (
              <div className="mt-8 relative z-10">
                <p className="mb-3 text-sm font-bold uppercase text-navy-400 tracking-wider">
                  Selected Dates ({selectedDates.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((date) => (
                    <div
                      key={date.toISOString()}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-navy-900 bg-blue-400 px-4 py-2 text-sm font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] -translate-y-0.5"
                    >
                      {format(date, "MMM d")}
                      <button
                        onClick={() => removeDate(date)}
                        className="hover:text-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time slot form */}
            <div className="mt-8 space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Start time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <Input
                  label="End time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <Input
                label="Total spots"
                type="number"
                value={spotsTotal}
                onChange={(e) => setSpotsTotal(e.target.value)}
              />
              <Button
                size="lg"
                onClick={handleBulkCreate}
                loading={creating}
                disabled={selectedDates.length === 0}
                className="w-full mt-4 rounded-full border-4 border-navy-900 bg-light-green-400 text-navy-900 font-bold shadow-[4px_4px_0_theme(colors.navy.900)] hover:-translate-y-1 transition-all"
              >
                {creating
                  ? "Creating..."
                  : selectedDates.length === 0
                    ? "Select dates first"
                    : `Create ${selectedDates.length} Time Slot${selectedDates.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimeSlotsPage() {
  return (
    <ProviderGuard>
      <TimeSlotsContent />
    </ProviderGuard>
  );
}
