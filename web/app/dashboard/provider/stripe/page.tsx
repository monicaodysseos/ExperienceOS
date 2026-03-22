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
      <h1 className="font-display text-4xl font-bold text-navy-900 ">Payment Settings</h1>
      <p className="mt-2 text-lg font-bold text-navy-500">
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
        <Skeleton className="mt-8 h-48 w-full rounded-xl" />
      ) : status?.charges_enabled ? (
        <div className="mt-8 rounded-[2.5rem] border-4 border-navy-900 bg-light-green-400 p-10 text-center shadow-playful blob-shape-3 relative">
          <CheckCircle2 className="mx-auto h-16 w-16 text-navy-900 relative z-10" />
          <h3 className="mt-6 font-display text-3xl font-bold text-navy-900  relative z-10">
            Payments Active
          </h3>
          <p className="mt-3 text-base font-bold text-navy-900 relative z-10">
            Your Stripe account is connected and ready to receive payments.
          </p>
        </div>
      ) : status?.connected ? (
        <div className="mt-8 rounded-[2.5rem] border-4 border-navy-900 bg-yellow-400 p-10 text-center shadow-playful relative">
          <AlertCircle className="mx-auto h-16 w-16 text-navy-900 relative z-10" />
          <h3 className="mt-6 font-display text-3xl font-bold text-navy-900  relative z-10">
            Onboarding In Progress
          </h3>
          <p className="mt-3 text-base font-bold text-navy-900 relative z-10">
            Your Stripe account is connected but additional verification may be
            needed.
          </p>
          <Button
            size="lg"
            className="mt-8 rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-white text-navy-900 font-bold hover:-translate-y-1 transition-all relative z-10"
            loading={connecting}
            onClick={handleConnect}
          >
            Complete Verification
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="mt-8 rounded-[2.5rem] border-4 border-navy-900 bg-white p-10 text-center shadow-playful relative">
          <CreditCard className="mx-auto h-16 w-16 text-navy-900" />
          <h3 className="mt-6 font-display text-3xl font-bold text-navy-900 ">
            Set Up Payments
          </h3>
          <p className="mt-3 text-base font-bold text-navy-500 max-w-sm mx-auto">
            Connect your Stripe account to start receiving payments from
            guests. Setup takes about 5 minutes.
          </p>
          <Button
            className="mt-8 rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-blue-400 text-navy-900 font-bold hover:-translate-y-1 transition-all"
            size="lg"
            loading={connecting}
            onClick={handleConnect}
          >
            Connect with Stripe
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>

          <div className="mt-8 border-t-[3px] border-navy-900/20 pt-6">
            <p className="text-xs font-bold text-navy-400 mb-4 uppercase tracking-wider">Testing only</p>
            <Button
              size="sm"
              loading={mocking}
              onClick={handleMockConnect}
              className="rounded-full border-2 border-navy-900 bg-sand-100 text-navy-900 font-bold hover:shadow-[2px_2px_0_theme(colors.navy.900)] hover:-translate-y-0.5 transition-all"
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
