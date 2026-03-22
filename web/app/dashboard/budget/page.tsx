"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, RefreshCw } from "lucide-react";
import { api, type Department, type BudgetTransaction } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const TYPE_STYLES: Record<string, { bg: string; icon: typeof ArrowUpRight; label: string }> = {
  allocation: { bg: "bg-green-100 text-green-700", icon: ArrowUpRight, label: "Allocation" },
  booking: { bg: "bg-blue-100 text-blue-700", icon: ArrowDownRight, label: "Booking" },
  refund: { bg: "bg-orange-100 text-orange-700", icon: RefreshCw, label: "Refund" },
  adjustment: { bg: "bg-purple-100 text-purple-700", icon: TrendingUp, label: "Adjustment" },
};

export default function BudgetPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    api.getDepartments()
      .then((d) => {
        setDepartments(d.results);
        if (d.results.length > 0) setSelectedDept(d.results[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDept) return;
    setLoadingTx(true);
    api.getDepartmentTransactions(selectedDept)
      .then((d) => setTransactions(d.results))
      .catch(() => {})
      .finally(() => setLoadingTx(false));
  }, [selectedDept]);

  const dept = departments.find((d) => d.id === selectedDept);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <EmptyState
          icon={<Wallet className="h-7 w-7" />}
          title="No departments yet"
          description="You haven't been assigned to any departments. Contact your HR manager."
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="font-display text-5xl font-bold text-navy-900 mb-2">Budget</h1>
      <p className="text-lg font-bold text-navy-500 mb-8">Track your department spending and budget allocation</p>

      {/* Department selector */}
      {departments.length > 1 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id)}
              className={`px-4 py-2 rounded-full font-bold border-2 border-navy-900 transition-all ${
                selectedDept === d.id
                  ? "bg-blue-400 text-navy-900 shadow-playful"
                  : "bg-white text-navy-700 hover:bg-navy-50"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {/* Budget summary cards */}
      {dept && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-[2rem] bg-green-300 p-6 border-4 border-navy-900 shadow-playful">
            <p className="text-sm font-bold text-navy-900 mb-1">Total Budget</p>
            <p className="font-display text-4xl font-bold text-navy-900">
              €{parseFloat(dept.budget_total).toLocaleString()}
            </p>
            {dept.budget_period_start && dept.budget_period_end && (
              <p className="mt-2 text-xs font-medium text-navy-700">
                {new Date(dept.budget_period_start).toLocaleDateString()} – {new Date(dept.budget_period_end).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="rounded-[2rem] bg-blue-300 p-6 border-4 border-navy-900 shadow-playful">
            <p className="text-sm font-bold text-navy-900 mb-1">Spent</p>
            <p className="font-display text-4xl font-bold text-navy-900">
              €{parseFloat(dept.budget_spent).toLocaleString()}
            </p>
            <p className="mt-2 text-xs font-medium text-navy-700">
              {parseFloat(dept.budget_total) > 0
                ? `${((parseFloat(dept.budget_spent) / parseFloat(dept.budget_total)) * 100).toFixed(0)}% used`
                : "No budget set"}
            </p>
          </div>

          <div className="rounded-[2rem] bg-orange-300 p-6 border-4 border-navy-900 shadow-playful">
            <p className="text-sm font-bold text-navy-900 mb-1">Remaining</p>
            <p className="font-display text-4xl font-bold text-navy-900">
              €{parseFloat(dept.budget_remaining).toLocaleString()}
            </p>
            <div className="mt-3 h-3 rounded-full bg-navy-900/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-navy-900 transition-all"
                style={{
                  width: `${parseFloat(dept.budget_total) > 0
                    ? Math.min((parseFloat(dept.budget_remaining) / parseFloat(dept.budget_total)) * 100, 100)
                    : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="rounded-[2rem] bg-white border-4 border-navy-900 shadow-playful overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-navy-100">
          <h2 className="font-bold text-xl text-navy-900">Transaction History</h2>
        </div>

        {loadingTx ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="h-10 w-10 text-navy-300 mx-auto mb-3" />
            <p className="font-bold text-navy-400">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-navy-100">
            {transactions.map((tx) => {
              const style = TYPE_STYLES[tx.type] || TYPE_STYLES.adjustment;
              const Icon = style.icon;
              const isPositive = tx.type === "allocation" || tx.type === "refund";

              return (
                <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-navy-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${style.bg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-navy-900">{style.label}</p>
                      {tx.note && <p className="text-sm text-navy-500 mt-0.5">{tx.note}</p>}
                      {tx.booking_reference && (
                        <p className="text-xs text-navy-400 mt-0.5">Ref: {tx.booking_reference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${isPositive ? "text-green-600" : "text-navy-900"}`}>
                      {isPositive ? "+" : "−"}€{Math.abs(parseFloat(tx.amount)).toLocaleString()}
                    </p>
                    <p className="text-xs text-navy-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
