"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isAfter,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Users, MapPin } from "lucide-react";
import { api, type TimeSlot, type ExperienceListItem } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SlotWithExperience extends TimeSlot {
  experienceTitle: string;
  experienceSlug: string;
  experienceCity: string;
  pricePerPerson: string;
  currency: string;
}

function HRCalendarContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allSlots, setAllSlots] = useState<SlotWithExperience[]>([]);
  const [experiences, setExperiences] = useState<ExperienceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithExperience | null>(null);

  useEffect(() => {
    api
      .getExperiences()
      .then(async (res) => {
        const exps = res.results || [];
        setExperiences(exps);

        const slotResults = await Promise.all(
          exps.map((exp) =>
            api
              .getTimeSlots(exp.slug)
              .then((d) =>
                (d.results || []).map((s): SlotWithExperience => ({
                  ...s,
                  experienceTitle: exp.title,
                  experienceSlug: exp.slug,
                  experienceCity: exp.city,
                  pricePerPerson: exp.price_per_person,
                  currency: exp.currency,
                }))
              )
              .catch(() => [] as SlotWithExperience[])
          )
        );

        const now = new Date();
        const available = slotResults
          .flat()
          .filter((s) => s.is_available && isAfter(new Date(s.start_datetime), now));

        setAllSlots(available);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-black text-navy-900 title-shadow">Events Calendar</h1>
          <p className="mt-2 text-lg font-bold text-navy-500">
            Browse available experiences and book for your team
          </p>
        </div>
        <Link href="/experiences">
          <Button size="lg" className="rounded-full border-4 border-navy-900 bg-yellow-400 shadow-[4px_4px_0_theme(colors.navy.900)] text-navy-900 font-black hover:-translate-y-1 transition-all">
            Browse all experiences
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <div className="overflow-hidden rounded-[2.5rem] border-4 border-navy-900 bg-white shadow-playful">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-navy-900">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-navy-100 bg-navy-50/50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-sm font-medium text-navy-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-navy-400">
              Loading available sessions…
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const daySlots = allSlots.filter((slot) =>
                  isSameDay(new Date(slot.start_datetime), day)
                );
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "min-h-[110px] border-b border-r border-navy-100 p-2 transition-colors",
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

                    <div className="mt-1 space-y-1">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() =>
                            setSelectedSlot(
                              selectedSlot?.id === slot.id ? null : slot
                            )
                          }
                          className={cn(
                            "w-full rounded-md border px-1.5 py-1 text-left text-xs transition-colors",
                            selectedSlot?.id === slot.id
                              ? "border-teal-600 bg-teal-100 text-teal-800"
                              : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
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
                            {slot.spots_remaining} spot{slot.spots_remaining !== 1 ? "s" : ""} left
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {selectedSlot ? (
            <div className="rounded-[2.5rem] border-4 border-navy-900 bg-purple-400 p-8 shadow-playful blob-shape-3 relative">
              <h3 className="font-display text-2xl font-black text-navy-900 line-clamp-2 title-shadow relative z-10">
                {selectedSlot.experienceTitle}
              </h3>

              <div className="mt-6 space-y-3 text-sm font-bold text-navy-900 relative z-10">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-navy-900" />
                  <span>
                    {format(new Date(selectedSlot.start_datetime), "EEE, d MMM · HH:mm")}
                    {" – "}
                    {format(new Date(selectedSlot.end_datetime), "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-navy-900" />
                  <span>{selectedSlot.experienceCity}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 shrink-0 text-navy-900" />
                  <span>{selectedSlot.spots_remaining} spot{selectedSlot.spots_remaining !== 1 ? "s" : ""} available</span>
                </div>
              </div>

              <div className="mt-6 border-t-[3px] border-navy-900/20 pt-6 relative z-10">
                <p className="font-display text-4xl font-black text-navy-900 title-shadow">
                  {selectedSlot.currency === "EUR" ? "€" : "$"}
                  {parseFloat(selectedSlot.pricePerPerson).toFixed(0)}
                  <span className="text-lg font-bold text-navy-900"> / person</span>
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4 relative z-10">
                <Link href={`/experiences/${selectedSlot.experienceSlug}`}>
                  <Button size="lg" className="w-full rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-white text-navy-900 font-black hover:-translate-y-1 transition-all">Book this session</Button>
                </Link>
                <Link href={`/experiences/${selectedSlot.experienceSlug}`}>
                  <Button size="lg" className="w-full rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-orange-400 text-navy-900 font-black hover:-translate-y-1 transition-all">
                    View experience
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-4 border-dashed border-navy-300 bg-navy-50 p-8 text-center">
              <p className="text-lg font-bold text-navy-500">
                Click a session on the calendar to see details and book
              </p>
            </div>
          )}

          {/* Upcoming summary */}
          {!isLoading && allSlots.length > 0 && (
            <div className="rounded-[2.5rem] border-4 border-navy-900 bg-light-green-400 p-8 shadow-[4px_4px_0_theme(colors.navy.900)]">
              <h4 className="font-display text-xl font-black text-navy-900 title-shadow">
                Upcoming this month
              </h4>
              <p className="mt-2 font-display text-5xl font-black text-navy-900 title-shadow">
                {
                  allSlots.filter((s) =>
                    new Date(s.start_datetime).getMonth() === currentDate.getMonth() &&
                    new Date(s.start_datetime).getFullYear() === currentDate.getFullYear()
                  ).length
                }
              </p>
              <p className="mt-2 text-sm font-bold text-navy-900">available sessions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HRCalendarPage() {
  return (
    <AuthGuard>
      <HRCalendarContent />
    </AuthGuard>
  );
}
