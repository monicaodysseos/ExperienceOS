"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";

type State = "verifying" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const user = useAuth((s) => s.user);
  const loadUser = useAuth((s) => s.loadUser);

  const [state, setState] = useState<State>(token ? "verifying" : "no-token");
  const [errorMsg, setErrorMsg] = useState("This verification link is invalid or has expired.");
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .verifyEmail(token)
      .then(async () => {
        // Refresh user to reflect is_email_verified = true
        await loadUser();
        setState("success");
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : "Verification failed.");
        setState("error");
      });
  }, [token, loadUser]);

  const handleResend = async () => {
    setResending(true);
    try {
      await api.resendVerification();
      setResendDone(true);
    } catch {
      // silently ignore — user may not be logged in
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-sm ring-1 ring-sand-200 text-center">
        {state === "verifying" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50">
              <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-navy-900">
              Verifying your email…
            </h1>
            <p className="mt-2 text-navy-500">Just a moment.</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-navy-900">
              Email verified!
            </h1>
            <p className="mt-2 text-navy-500">
              Your account is now fully active.
            </p>
            <Button
              className="mt-8 w-full"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-navy-900">
              Verification failed
            </h1>
            <p className="mt-2 text-navy-500">{errorMsg}</p>
            {user && !user.is_email_verified && (
              <div className="mt-8">
                {resendDone ? (
                  <p className="text-sm font-medium text-emerald-600">
                    A new verification email has been sent.
                  </p>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full"
                    loading={resending}
                    onClick={handleResend}
                  >
                    Resend verification email
                  </Button>
                )}
              </div>
            )}
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm font-medium text-navy-500 hover:text-crimson-600 transition-colors"
            >
              Continue anyway
            </Link>
          </>
        )}

        {state === "no-token" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sand-100">
              <Mail className="h-8 w-8 text-navy-400" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-navy-900">
              Check your email
            </h1>
            <p className="mt-2 text-navy-500">
              We sent a verification link to your email address. Click it to
              activate your account.
            </p>
            {user && !user.is_email_verified && (
              <div className="mt-8">
                {resendDone ? (
                  <p className="text-sm font-medium text-emerald-600">
                    A new verification email has been sent.
                  </p>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full"
                    loading={resending}
                    onClick={handleResend}
                  >
                    Resend verification email
                  </Button>
                )}
              </div>
            )}
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm font-medium text-navy-500 hover:text-crimson-600 transition-colors"
            >
              Skip for now
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
