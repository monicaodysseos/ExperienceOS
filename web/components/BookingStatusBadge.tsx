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
    classes: "bg-yellow-400 text-navy-900 border-2 border-navy-900",
  },
  confirmed: {
    label: "Confirmed",
    classes: "bg-light-green-400 text-navy-900 border-2 border-navy-900",
  },
  cancelled_by_participant: {
    label: "Cancelled",
    classes: "bg-orange-400 text-navy-900 border-2 border-navy-900",
  },
  cancelled_by_provider: {
    label: "Cancelled by Provider",
    classes: "bg-orange-400 text-navy-900 border-2 border-navy-900",
  },
  completed: {
    label: "Completed",
    classes: "bg-blue-400 text-navy-900 border-2 border-navy-900",
  },
  no_show: {
    label: "No Show",
    classes: "bg-sand-400 text-navy-900 border-2 border-navy-900",
  },
  refunded: {
    label: "Refunded",
    classes: "bg-purple-400 text-navy-900 border-2 border-navy-900",
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
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-bold shadow-sm",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
