"use client";

import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  selected?: Date | Date[];
  onSelect?: (date: Date | Date[] | undefined) => void;
  /** Restrict selectable dates to this list (used by booking widget) */
  availableDates?: Date[];
  /** Visually mark these dates with a dot indicator (no restriction) */
  markedDates?: Date[];
  className?: string;
  disabled?: (date: Date) => boolean;
  mode?: "single" | "multiple";
}

export function Calendar({
  selected,
  onSelect,
  availableDates,
  markedDates,
  className,
  disabled,
  mode = "single",
}: CalendarProps) {
  const isAvailable = (date: Date) => {
    if (!availableDates) return true;
    return availableDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  const isMarked = (date: Date) => {
    if (!markedDates) return false;
    return markedDates.some((d) => d.toDateString() === date.toDateString());
  };

  const defaultDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    // Only restrict by availableDates in single mode (booking widget)
    if (mode === "single" && availableDates && !isAvailable(date)) return true;
    if (disabled) return disabled(date);
    return false;
  };

  const sharedClassNames = {
    months: "flex flex-col",
    month_caption: "flex justify-center items-center py-2",
    caption_label: "text-sm font-semibold text-navy-900",
    nav: "flex items-center gap-1",
    button_previous:
      "absolute left-2 top-3 h-7 w-7 inline-flex items-center justify-center rounded-lg border border-navy-200 bg-white text-navy-600 hover:bg-navy-50 transition-colors",
    button_next:
      "absolute right-2 top-3 h-7 w-7 inline-flex items-center justify-center rounded-lg border border-navy-200 bg-white text-navy-600 hover:bg-navy-50 transition-colors",
    month_grid: "w-full border-collapse",
    weekdays: "flex",
    weekday:
      "w-9 text-center text-xs font-medium text-navy-400 py-1",
    week: "flex mt-1",
    day: "h-9 w-9 text-center text-sm relative",
    day_button:
      "h-9 w-9 rounded-lg transition-colors hover:bg-teal-50 hover:text-teal-700 inline-flex items-center justify-center",
    selected:
      "bg-teal-700 text-white rounded-lg hover:bg-teal-800",
    today: "font-bold text-teal-700",
    disabled: "text-navy-300 opacity-50 cursor-not-allowed hover:bg-transparent",
    outside: "text-navy-300 opacity-50",
  };

  const sharedComponents = {
    Chevron: ({ orientation }: { orientation?: "down" | "up" | "left" | "right" }) =>
      orientation === "left" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      ),
    DayButton: ({ day, modifiers, ...props }: React.ComponentProps<"button"> & { day: { date: Date }; modifiers: Record<string, boolean> }) => {
      const marked = isMarked(day.date);
      return (
        <button {...props} className={cn(props.className)}>
          {day.date.getDate()}
          {marked && !modifiers.selected && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-teal-600" />
          )}
        </button>
      );
    },
  };

  if (mode === "multiple") {
    return (
      <DayPicker
        mode="multiple"
        selected={Array.isArray(selected) ? selected : undefined}
        onSelect={onSelect as any}
        disabled={defaultDisabled}
        className={cn("p-3", className)}
        classNames={sharedClassNames}
        components={sharedComponents as any}
      />
    );
  }

  return (
    <DayPicker
      mode="single"
      selected={!Array.isArray(selected) ? selected : undefined}
      onSelect={onSelect as any}
      disabled={defaultDisabled}
      className={cn("p-3", className)}
      classNames={sharedClassNames}
      components={sharedComponents as any}
    />
  );
}
