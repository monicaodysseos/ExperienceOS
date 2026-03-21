import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-navy-100 text-navy-400">
        <Compass className="h-10 w-10" />
      </div>
      <h1 className="mt-8 font-display text-6xl font-bold text-navy-900">404</h1>
      <p className="mt-4 text-xl font-medium text-navy-700">Page not found</p>
      <p className="mt-2 max-w-sm text-navy-500">
        This page doesn&apos;t exist or has moved. Let&apos;s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/experiences"
          className="rounded-xl border border-navy-200 bg-white px-6 py-3 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors"
        >
          Browse experiences
        </Link>
      </div>
    </div>
  );
}
