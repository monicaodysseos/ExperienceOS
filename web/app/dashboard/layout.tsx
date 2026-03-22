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
  Vote,
  Lightbulb,
  Wallet,
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

const DEPT_HEAD_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/teams", label: "My Teams", icon: Users },
  { href: "/dashboard/budget", label: "Budget", icon: Wallet },
  { href: "/dashboard/polls", label: "Polls", icon: Vote },
  { href: "/dashboard/bookings", label: "Team Bookings", icon: CalendarDays },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Settings", icon: Settings },
];

const EMPLOYEE_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/my-team", label: "My Team", icon: Users },
  { href: "/dashboard/suggestions", label: "Suggestions", icon: Lightbulb },
  { href: "/dashboard/polls", label: "Polls", icon: Vote },
  { href: "/dashboard/my-bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Settings", icon: Settings },
];

const PROVIDER_LINKS = [
  { href: "/dashboard/provider", label: "Provider Home", icon: Sparkles, exact: true },
  { href: "/dashboard/provider/experiences", label: "Experiences", icon: Package },
  { href: "/dashboard/provider/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/provider/bookings", label: "Bookings", icon: Users },
  { href: "/dashboard/provider/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/provider/payouts", label: "Payouts", icon: Briefcase },
  { href: "/dashboard/provider/stripe", label: "Stripe Settings", icon: CreditCard },
];

const HOVER_COLORS = [
  "hover:bg-blue-300",
  "hover:bg-green-300",
  "hover:bg-red-300",
  "hover:bg-orange-300",
  "hover:bg-purple-300",
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role;
  const primaryLinks =
    role === 'hr_manager' ? HR_LINKS :
    role === 'dept_head' ? DEPT_HEAD_LINKS :
    role === 'employee' ? EMPLOYEE_LINKS :
    USER_LINKS;
  const sidebarLabel =
    role === 'hr_manager' ? 'HR Portal' :
    role === 'dept_head' ? 'Department' :
    role === 'employee' ? 'My Workspace' :
    'Account';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
              {sidebarLabel}
            </p>
            {primaryLinks.map((link, index) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              const hoverColor = HOVER_COLORS[index % HOVER_COLORS.length];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-4 rounded-[2rem] px-4 py-3 text-base font-bold transition-all duration-300",
                    isActive
                      ? "bg-yellow-400 text-navy-900 shadow-playful border-4 border-navy-900 translate-x-2"
                      : `text-navy-700 ${hoverColor} border-4 border-transparent hover:border-navy-900 hover:shadow-playful hover:translate-x-1`
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
                {PROVIDER_LINKS.map((link, index) => {
                  const isActive = link.exact
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                  const hoverColor = HOVER_COLORS[(index + 2) % HOVER_COLORS.length]; // Offset so it looks different
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-4 rounded-[2rem] px-4 py-3 text-sm font-bold transition-all duration-300",
                        isActive
                          ? "bg-light-green-400 text-navy-900 shadow-playful border-4 border-navy-900 translate-x-2"
                          : `text-navy-700 ${hoverColor} border-4 border-transparent hover:border-navy-900 hover:shadow-playful hover:translate-x-1`
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
