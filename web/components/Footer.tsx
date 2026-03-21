"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FOOTER_LINKS = {
  explore: [
    { href: "/experiences", label: "Browse Experiences" },
    { href: "/experiences?city=nicosia", label: "Nicosia" },
    { href: "/experiences?city=limassol", label: "Limassol" },
    { href: "/experiences?category=tours", label: "Tours" },
    { href: "/experiences?category=workshops", label: "Workshops" },
  ],
  company: [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/become-provider", label: "Become a Provider" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/gdpr", label: "GDPR" },
  ],
};

export function Footer() {
  const pathname = usePathname();

  // Hide footer on auth pages
  if (pathname.startsWith("/auth")) return null;

  return (
    <footer className="bg-navy-900 text-white">
      {/* Gradient line at top */}
      <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-coral-500" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
                EO
              </div>
              <span className="text-lg font-bold">ExperienceOS</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-navy-400">
              Discover Cyprus one experience at a time. From cooking classes to
              sunset yacht tours, find your next unforgettable adventure.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-400">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-navy-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-400">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-navy-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-400">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-navy-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-navy-800 pt-8 text-center">
          <p className="text-sm text-navy-500">
            &copy; {new Date().getFullYear()} ExperienceOS. All rights reserved.
            Made with love in Cyprus.
          </p>
        </div>
      </div>
    </footer>
  );
}
