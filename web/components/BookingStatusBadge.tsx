import { cn } from "@/lib/utils";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled_by_participant"
  | "cancelled_by_provider"
  | "completed"
  | "no_show"
  | "refunded";

interface BookingStatusBadgeProps {
  status: BookingStatus | string;
  className?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string }
> = {
  pending: {
    label: "Pending Payment",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  cancelled_by_participant: {
    label: "Cancelled",
    classes: "bg-red-50 text-red-600 ring-red-200",
  },
  cancelled_by_provider: {
    label: "Cancelled by Provider",
    classes: "bg-red-50 text-red-600 ring-red-200",
  },
  completed: {
    label: "Completed",
    classes: "bg-navy-50 text-navy-700 ring-navy-200",
  },
  no_show: {
    label: "No Show",
    classes: "bg-gray-100 text-gray-500 ring-gray-200",
  },
  refunded: {
    label: "Refunded",
    classes: "bg-purple-50 text-purple-700 ring-purple-200",
  },
};

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    classes: "bg-gray-100 text-gray-600 ring-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
