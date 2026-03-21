"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, CalendarCheck, CheckCheck } from "lucide-react";
import { api, type AppNotification } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICON: Record<AppNotification["type"], React.ReactNode> = {
  new_message: <MessageSquare className="h-4 w-4 text-teal-600" />,
  new_booking: <CalendarCheck className="h-4 w-4 text-coral-500" />,
};

export function NotificationBell({ isTransparent }: { isTransparent: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setUnread(data.unread_count);
      setNotifications(data.results);
    } catch {
      // ignore
    }
  }, []);

  // Initial fetch + poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.is_read) {
      await api.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleOpen}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          isTransparent
            ? "text-white/80 hover:bg-white/10 hover:text-white"
            : "text-navy-600 hover:bg-navy-50 hover:text-navy-900"
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-navy-200 bg-white shadow-elevated">
          <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
            <p className="text-sm font-semibold text-navy-900">Notifications</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-navy-200" />
                <p className="text-sm text-navy-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-navy-50",
                    !n.is_read && "bg-teal-50/40"
                  )}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100">
                    {TYPE_ICON[n.type]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm text-navy-900", !n.is_read && "font-semibold")}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 truncate text-xs text-navy-500">{n.body}</p>
                    )}
                    <p className="mt-1 text-[10px] text-navy-400">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
