"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry when available
    if (typeof window !== "undefined" && (window as { Sentry?: { captureException: (e: Error) => void } }).Sentry) {
      (window as { Sentry: { captureException: (e: Error) => void } }).Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-crimson-50 text-crimson-500">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h1 className="mt-8 font-display text-4xl font-bold text-navy-900">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-sm text-navy-500">
        An unexpected error occurred. Our team has been notified. Please try
        again or go back to the homepage.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-navy-400">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-navy-200 bg-white px-6 py-3 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
