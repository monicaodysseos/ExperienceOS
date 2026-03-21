"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  Package,
  CalendarDays,
  LayoutDashboard,
  UserCog,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/vendors", label: "Vendors", icon: Users },
  { href: "/admin/experiences", label: "Experiences", icon: Package },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/users", label: "Users", icon: UserCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== "admin" && !user?.is_staff))) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-900" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "admin" && !(user as { is_staff?: boolean })?.is_staff)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-sand-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-sand-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-sand-200 px-4">
          <ShieldCheck className="h-5 w-5 text-crimson-600" />
          <span className="font-semibold text-navy-900">Admin</span>
        </div>
        <nav className="p-3 space-y-0.5">
          {ADMIN_LINKS.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-crimson-50 text-crimson-700"
                    : "text-navy-600 hover:bg-navy-50 hover:text-navy-900"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-0 w-56 px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-navy-500 hover:bg-navy-50 hover:text-navy-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Back to app
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
