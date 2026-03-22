"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  Settings,
  Sparkles,
  Package,
  CreditCard,
  Users,
  Calendar,
  Briefcase,
  FileText,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { AuthGuard } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";

const USER_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/my-bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Settings", icon: Settings },
];

const HR_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/calendar", label: "Events Calendar", icon: Calendar },
  { href: "/dashboard/bookings", label: "Team Bookings", icon: CalendarDays },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Settings", icon: Settings },
];

const PROVIDER_LINKS = [
  { href: "/dashboard/provider", label: "Provider Home", icon: Sparkles, exact: true },
  { href: "/dashboard/provider/experiences", label: "Experiences", icon: Package },
  { href: "/dashboard/provider/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/provider/bookings", label: "Bookings", icon: Users },
  { href: "/dashboard/provider/payouts", label: "Payouts", icon: Briefcase },
  { href: "/dashboard/provider/stripe", label: "Stripe Settings", icon: CreditCard },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isHR = user?.role === 'hr_manager';
  const primaryLinks = isHR ? HR_LINKS : USER_LINKS;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
              {isHR ? 'HR Portal' : 'Account'}
            </p>
            {primaryLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-4 rounded-[2rem] px-4 py-3 text-base font-bold transition-all duration-300",
                    isActive
                      ? "bg-yellow-400 text-navy-900 shadow-playful border-4 border-navy-900 translate-x-2"
                      : "text-navy-700 hover:bg-purple-100 border-4 border-transparent hover:border-navy-900 hover:shadow-playful hover:translate-x-1"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            {user?.has_provider_profile && (
              <>
                <div className="my-4 border-t border-navy-200" />
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
                  Provider
                </p>
                {PROVIDER_LINKS.map((link) => {
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
                          ? "bg-coral-50 text-coral-700"
                          : "text-navy-600 hover:bg-navy-50 hover:text-navy-900"
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
