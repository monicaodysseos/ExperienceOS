"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ProviderGuard } from "@/components/ProviderGuard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

function StripeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<{
    connected: boolean;
    charges_enabled: boolean;
    onboarding_complete: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [mocking, setMocking] = useState(false);

  const refresh = searchParams.get("refresh");
  const complete = searchParams.get("complete");

  useEffect(() => {
    api
      .getStripeStatus()
      .then(setStatus)
      .catch(() =>
        setStatus({
          connected: false,
          charges_enabled: false,
          onboarding_complete: false,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { onboarding_url } = await api.startStripeOnboarding();
      window.location.href = onboarding_url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start onboarding"
      );
      setConnecting(false);
    }
  };

  const handleMockConnect = async () => {
    setMocking(true);
    try {
      const result = await api.mockStripeConnect();
      setStatus(result);
      toast.success("Mock Stripe connection activated for testing");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mock connect failed");
    } finally {
      setMocking(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Payment Settings</h1>
      <p className="mt-1 text-navy-500">
        Connect with Stripe to receive payments
      </p>

      {refresh && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Your onboarding session expired. Please try again.
          </p>
        </div>
      )}

      {complete && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-teal-50 p-4 text-teal-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Onboarding submitted! Your account is being reviewed.
          </p>
        </div>
      )}

      {loading ? (
        <Skeleton className="mt-6 h-48 w-full rounded-xl" />
      ) : status?.charges_enabled ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-xl font-semibold text-emerald-900">
            Payments Active
          </h3>
          <p className="mt-2 text-sm text-emerald-700">
            Your Stripe account is connected and ready to receive payments.
          </p>
        </div>
      ) : status?.connected ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
          <h3 className="mt-4 text-xl font-semibold text-amber-900">
            Onboarding In Progress
          </h3>
          <p className="mt-2 text-sm text-amber-700">
            Your Stripe account is connected but additional verification may be
            needed.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            loading={connecting}
            onClick={handleConnect}
          >
            Complete Verification
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-navy-200 bg-white p-8 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-navy-400" />
          <h3 className="mt-4 text-xl font-semibold text-navy-900">
            Set Up Payments
          </h3>
          <p className="mt-2 text-sm text-navy-500 max-w-sm mx-auto">
            Connect your Stripe account to start receiving payments from
            guests. Setup takes about 5 minutes.
          </p>
          <Button
            className="mt-6"
            size="lg"
            loading={connecting}
            onClick={handleConnect}
          >
            Connect with Stripe
            <ExternalLink className="h-4 w-4" />
          </Button>

          <div className="mt-4 border-t border-navy-100 pt-4">
            <p className="text-xs text-navy-400 mb-3">Testing only</p>
            <Button
              variant="outline"
              size="sm"
              loading={mocking}
              onClick={handleMockConnect}
              className="text-navy-500"
            >
              Mock connect (skip Stripe)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StripePage() {
  return (
    <ProviderGuard>
      <Suspense>
        <StripeContent />
      </Suspense>
    </ProviderGuard>
  );
}
