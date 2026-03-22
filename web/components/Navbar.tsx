"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, User, CalendarDays, MessageSquare, LayoutDashboard, LogOut, Settings, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";

const NAV_LINKS = [
  { href: "/experiences", label: "Experiences" },
  { href: "/map", label: "Map", hideForRoles: ["hr_manager"], hideIfProvider: true },
  { href: "/join", label: "Join Team", hideForRoles: ["hr_manager"], hideIfProvider: true },
  { href: "/how-it-works", label: "How It Works", hideForRoles: ["hr_manager"], hideIfProvider: true },
  { href: "/become-provider", label: "Become a Provider", hideForRoles: ["hr_manager"], hideIfProvider: true },
];

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isLanding = pathname === "/";
  const isAuthPage = pathname.startsWith("/auth");
  const isProvider = !!(user?.has_provider_profile);
  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.hideForRoles && user && link.hideForRoles.includes(user.role ?? "")) return false;
    if (link.hideIfProvider && isProvider) return false;
    return true;
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  if (isAuthPage) return null;

  const isTransparent = isLanding && !scrolled && !mobileOpen;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isTransparent
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-md border-b border-navy-100 shadow-soft"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link 
          href={isAuthenticated ? "/dashboard" : "/"} 
          className="flex items-center gap-2 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
        >
          <img 
            src="/vivido-logo.png" 
            alt="ViVi DO Creative Activities" 
            className="h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-sm"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {isAuthenticated && user && (
            <Link
              href="/dashboard"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/dashboard")
                  ? isTransparent
                    ? "text-white bg-white/10"
                    : "text-blue-700 bg-blue-50"
                  : isTransparent
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-navy-600 hover:text-navy-900 hover:bg-navy-50"
              )}
            >
              Dashboard
            </Link>
          )}
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? isTransparent
                    ? "text-white bg-white/10"
                    : "text-blue-700 bg-blue-50"
                  : isTransparent
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-navy-600 hover:text-navy-900 hover:bg-navy-50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-navy-100" />
          ) : isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-transform hover:scale-105 active:scale-95",
                  isTransparent
                    ? "hover:bg-white/10"
                    : "hover:bg-purple-50 border-2 border-purple-200"
                )}
              >
                <Avatar
                  name={`${user.first_name} ${user.last_name}`}
                  src={user.avatar_url}
                  size="sm"
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isTransparent ? "text-white" : "text-navy-700"
                  )}
                >
                  {user.first_name}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4",
                    isTransparent ? "text-white/60" : "text-navy-400"
                  )}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-navy-200 bg-white py-1 shadow-elevated">
                    <div className="border-b border-navy-100 px-4 py-3">
                      <p className="text-sm font-semibold text-navy-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-navy-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <DropdownLink href="/dashboard" icon={LayoutDashboard}>
                        Dashboard
                      </DropdownLink>
                      <DropdownLink href="/dashboard/my-bookings" icon={CalendarDays}>
                        My Bookings
                      </DropdownLink>
                      <DropdownLink href="/dashboard/messages" icon={MessageSquare}>
                        Messages
                      </DropdownLink>
                    </div>
                    {user.has_provider_profile && (
                      <div className="border-t border-navy-100 py-1">
                        <DropdownLink href="/dashboard/provider" icon={Sparkles}>
                          Provider Dashboard
                        </DropdownLink>
                      </div>
                    )}
                    <div className="border-t border-navy-100 py-1">
                      <DropdownLink href="/dashboard/profile" icon={Settings}>
                        Settings
                      </DropdownLink>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="sm" variant="outline">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  size="sm"
                  variant={isTransparent ? "secondary" : "primary"}
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            "rounded-lg p-2 md:hidden",
            isTransparent
              ? "text-white hover:bg-white/10"
              : "text-navy-600 hover:bg-navy-50"
          )}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-navy-100 bg-white px-4 pb-4 md:hidden">
          <div className="space-y-1 py-3">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-navy-600 hover:bg-navy-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-navy-100 pt-3">
            {isAuthenticated && user ? (
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 hover:bg-navy-50"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/my-bookings"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 hover:bg-navy-50"
                >
                  My Bookings
                </Link>
                <Link
                  href="/dashboard/messages"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 hover:bg-navy-50"
                >
                  Messages
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" className="flex-1">
                  <Button variant="primary" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function DropdownLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50"
    >
      <Icon className="h-4 w-4 text-navy-400" />
      {children}
    </Link>
  );
}
