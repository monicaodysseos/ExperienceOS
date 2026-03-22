"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { api, type TimeSlot, type ExperienceListItem } from "@/lib/api";
import { ProviderGuard } from "@/components/ProviderGuard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SlotWithExperience extends TimeSlot {
  experienceTitle: string;
  experienceSlug: string;
}

function ProviderCalendarContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [experiences, setExperiences] = useState<ExperienceListItem[]>([]);
  const [allSlots, setAllSlots] = useState<SlotWithExperience[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getMyExperiences()
      .then(async (res) => {
        const exps = res.results || [];
        setExperiences(exps);

        // Fetch all slots in parallel
        const slotResults = await Promise.all(
          exps.map((exp) =>
            api.getTimeSlots(exp.slug)
              .then((d) => (d.results || []).map((s): SlotWithExperience => ({
                ...s,
                experienceTitle: exp.title,
                experienceSlug: exp.slug,
              })))
              .catch(() => [] as SlotWithExperience[])
          )
        );
        setAllSlots(slotResults.flat());
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const toggleFilter = (slug: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const visibleSlots = activeFilters.size === 0
    ? allSlots
    : allSlots.filter((s) => activeFilters.has(s.experienceSlug));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-black text-navy-900 title-shadow">Calendar</h1>
          <p className="mt-2 text-lg font-bold text-navy-500">All your sessions across all experiences</p>
        </div>
      </div>

      {/* Experience filter chips */}
      {experiences.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {experiences.map((exp) => (
            <button
              key={exp.slug}
              type="button"
              onClick={() => toggleFilter(exp.slug)}
              className={cn(
                "rounded-full border-4 px-4 py-2 text-sm font-black transition-all",
                activeFilters.has(exp.slug)
                  ? "border-navy-900 bg-blue-400 text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] -translate-y-0.5"
                  : "border-transparent bg-white text-navy-600 hover:border-navy-200 hover:bg-sand-50"
              )}
            >
              {exp.title}
            </button>
          ))}
          {activeFilters.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilters(new Set())}
              className="rounded-full border-4 border-navy-200 bg-white px-4 py-2 text-sm font-black text-navy-400 hover:border-navy-300"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-[2.5rem] border-4 border-navy-900 bg-white shadow-playful">
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-navy-900">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-navy-100 bg-navy-50/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 text-center text-sm font-medium text-navy-600">
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-navy-400">
            Loading sessions…
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const daySlots = visibleSlots.filter((slot) =>
                isSameDay(new Date(slot.start_datetime), day)
              );
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[120px] border-b border-r border-navy-100 p-2 transition-colors hover:bg-navy-50/50",
                    !isCurrentMonth ? "bg-navy-50/30 text-navy-400" : "text-navy-900",
                    i % 7 === 6 && "border-r-0"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isSameDay(day, new Date()) &&
                        "flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  <div className="mt-2 space-y-1">
                    {daySlots.map((slot) => {
                      const booked = slot.spots_total - slot.spots_remaining;
                      const isFull = slot.spots_remaining === 0;

                      return (
                        <div
                          key={slot.id}
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs",
                            isFull
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-teal-200 bg-teal-50 text-teal-700"
                          )}
                        >
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3 shrink-0" />
                            {format(new Date(slot.start_datetime), "HH:mm")}
                          </div>
                          <div className="mt-0.5 truncate text-[10px] font-medium opacity-90">
                            {slot.experienceTitle}
                          </div>
                          <div className="mt-0.5 text-[10px] opacity-70">
                            {booked}/{slot.spots_total} booked · {slot.spots_remaining} left
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProviderCalendarPage() {
  return (
    <ProviderGuard>
      <ProviderCalendarContent />
    </ProviderGuard>
  );
}
