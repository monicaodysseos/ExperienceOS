"use client";

import { useEffect, useState } from "react";
import { Wallet, Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { api, type Payout } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  Payout["status"],
  { label: string; icon: React.ReactNode; className: string }
> = {
  paid: {
    label: "Paid",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "bg-red-50 text-red-700 ring-red-200",
  },
};

function PayoutStatusBadge({ status }: { status: Payout["status"] }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        config.className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totalPaid, setTotalPaid] = useState("0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProviderPayouts()
      .then((data) => {
        setPayouts(data.results || []);
        setTotalPaid(data.total_paid || "0");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="font-display text-4xl font-bold text-navy-900 title-shadow">Payouts</h1>
      <p className="mt-2 text-lg font-bold text-navy-500">Your Stripe payout history</p>

      {/* Summary card */}
      <div className="mt-8 rounded-[2.5rem] bg-light-green-400 border-4 border-navy-900 p-8 shadow-playful relative blob-shape-2">
        <div className="flex items-center gap-5 relative z-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] bg-white text-light-green-600">
            <Wallet className="h-8 w-8 text-navy-900" />
          </div>
          <div>
            <p className="text-base font-bold text-navy-900">Total paid out</p>
            <p className="font-display text-5xl font-bold text-navy-900 title-shadow">
              €{parseFloat(totalPaid).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Payouts list */}
      <div className="mt-6">
        {payouts.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-7 w-7" />}
            title="No payouts yet"
            description="Payouts are processed automatically after booking completion. They typically arrive within 2–5 business days."
          />
        ) : (
          <div className="rounded-[2.5rem] bg-white shadow-playful border-4 border-navy-900 overflow-hidden">
            <div className="divide-y-2 divide-navy-100">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between px-6 py-5 hover:bg-navy-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-navy-900 bg-yellow-400 text-navy-900 shadow-sm">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-xl font-bold text-navy-900">
                        €{parseFloat(payout.amount).toFixed(2)}{" "}
                        <span className="text-sm font-bold text-navy-400">
                          {payout.currency.toUpperCase()}
                        </span>
                      </p>
                      {payout.stripe_payout_id && (
                        <p className="mt-1 font-mono text-xs font-bold text-navy-400">
                          {payout.stripe_payout_id}
                        </p>
                      )}
                      {payout.period_start && payout.period_end && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-navy-500">
                          <Calendar className="h-4 w-4" />
                          {format(parseISO(payout.period_start), "d MMM")} –{" "}
                          {format(parseISO(payout.period_end), "d MMM yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="hidden sm:block text-sm font-bold text-navy-400">
                      {format(parseISO(payout.created_at), "d MMM yyyy")}
                    </p>
                    <div className="scale-110 origin-right">
                      <PayoutStatusBadge status={payout.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl bg-sand-50 px-5 py-4 text-sm text-navy-500">
        Payouts are processed by Stripe. For payout queries contact{" "}
        <a
          href="mailto:providers@experienceos.com"
          className="text-teal-600 hover:underline"
        >
          providers@experienceos.com
        </a>
        .
      </div>
    </div>
  );
}
