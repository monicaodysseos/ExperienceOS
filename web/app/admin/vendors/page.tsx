"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Package,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { api, type AdminVendor } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const FILTER_OPTS = [
  { value: "", label: "All vendors" },
  { value: "false", label: "Pending approval" },
  { value: "true", label: "Verified" },
];

function VendorRow({
  vendor,
  onAction,
}: {
  vendor: AdminVendor;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handle = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      if (action === "approve") {
        await api.approveVendor(vendor.id);
        toast.success(`${vendor.display_name} approved`);
      } else {
        await api.rejectVendor(vendor.id);
        toast.success(`${vendor.display_name} rejected`);
      }
      onAction();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-sand-200">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <p className="font-medium text-navy-900">{vendor.display_name}</p>
          {vendor.is_verified ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              Pending
            </span>
          )}
          {vendor.stripe_charges_enabled && (
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200">
              Stripe active
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-navy-500">
          <span>{vendor.user_email}</span>
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {vendor.experience_count} experience{vendor.experience_count !== 1 ? "s" : ""}
          </span>
          <span>Joined {format(parseISO(vendor.joined_at), "d MMM yyyy")}</span>
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2">
        {!vendor.is_verified && (
          <Button
            size="sm"
            onClick={() => handle("approve")}
            loading={loading === "approve"}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Approve
          </Button>
        )}
        {vendor.is_verified && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handle("reject")}
            loading={loading === "reject"}
            className="text-red-600 hover:bg-red-50"
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

function VendorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") ?? "";

  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getAdminVendors(verified ? { verified } : undefined)
      .then((d) => {
        setVendors(d.results || []);
        setTotal(d.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [verified]);

  useEffect(() => { load(); }, [load]);

  function setFilter(val: string) {
    const p = new URLSearchParams();
    if (val) p.set("verified", val);
    router.push(`/admin/vendors${p.toString() ? `?${p.toString()}` : ""}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy-900">Vendors</h1>
          <p className="mt-1 text-navy-500">{total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_OPTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              verified === opt.value
                ? "bg-navy-900 text-white"
                : "bg-white text-navy-600 ring-1 ring-sand-200 hover:bg-sand-50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-7 w-7" />}
          title="No vendors found"
          description="Adjust the filter above."
        />
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => (
            <VendorRow key={v.id} vendor={v} onAction={load} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminVendorsPage() {
  return (
    <Suspense>
      <VendorsContent />
    </Suspense>
  );
}
