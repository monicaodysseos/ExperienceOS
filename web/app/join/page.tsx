"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  Building2,
  ArrowRight,
  Loader2,
  QrCode,
  CheckCircle2,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";

interface InviteInfo {
  org_name: string;
  org_logo: string;
  target_role: string;
  short_code: string;
  email: string;
  expires_at: string;
}

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    dept_head: "Department Head",
    member: "Team Member",
  };

  // Auto-format code as user types: XXXX-XXXX
  const formatCode = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
    if (cleaned.length > 4) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    return cleaned;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
    setError("");
    setInviteInfo(null);
  };

  const lookupCode = useCallback(async (codeToLookup: string) => {
    if (codeToLookup.replace("-", "").length < 8) {
      setError("Please enter a complete 8-character code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const info = await api.lookupInvite(codeToLookup);
      setInviteInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid invite code");
      setInviteInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-lookup if code comes from URL
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode && urlCode.replace("-", "").length >= 8) {
      const formatted = formatCode(urlCode);
      setCode(formatted);
      lookupCode(formatted);
    }
  }, [searchParams, lookupCode]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    lookupCode(code);
  };

  const handleJoin = async () => {
    if (!inviteInfo) return;

    // If not logged in, redirect to register with invite code
    if (!isAuthenticated) {
      router.push(`/auth/register?invite=${inviteInfo.short_code}`);
      return;
    }

    // Already logged in — accept the invite directly
    setJoining(true);
    try {
      await api.acceptOrgInviteByCode(inviteInfo.short_code);
      setJoined(true);
      toast.success(`You've joined ${inviteInfo.org_name}!`);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  if (joined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-400 border-4 border-navy-900 shadow-playful mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-navy-900" />
          </div>
          <h1 className="font-display text-4xl font-bold text-navy-900 mb-3">
            You&apos;re in! 🎉
          </h1>
          <p className="text-lg text-navy-500 font-bold">
            You&apos;ve successfully joined <strong>{inviteInfo?.org_name}</strong>.
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-navy-900 shadow-playful bg-purple-400 text-navy-900 mx-auto mb-6">
            <UserPlus className="h-8 w-8" />
          </div>
          <h1 className="font-display text-4xl font-bold text-navy-900">
            Join a Team
          </h1>
          <p className="mt-3 text-lg font-bold text-navy-500">
            Enter the invite code shared by your HR Manager or team lead.
          </p>
        </div>

        {/* Code Entry Card */}
        <div className="rounded-[2.5rem] bg-white border-4 border-navy-900 shadow-playful p-8">
          <form onSubmit={handleLookup}>
            <label className="block text-sm font-bold text-navy-700 mb-2">
              Invite Code
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-navy-400" />
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="XXXX-XXXX"
                  className="w-full rounded-xl border-3 border-navy-300 bg-navy-50 pl-12 pr-4 py-3.5 text-xl font-mono font-bold text-navy-900 tracking-widest placeholder:text-navy-300 placeholder:tracking-widest focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10 transition-all text-center"
                  maxLength={9}
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                loading={loading}
                disabled={code.replace("-", "").length < 8}
                className="rounded-xl border-4 border-navy-900 bg-yellow-400 text-navy-900 font-bold shadow-playful hover:-translate-y-0.5 transition-all px-6"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600 font-bold">{error}</p>
            )}
          </form>

          {/* QR Scanner Hint */}
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-navy-50 p-4">
            <QrCode className="h-8 w-8 text-navy-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-navy-700">Have a QR code?</p>
              <p className="text-xs text-navy-500">
                Scan it with your phone camera — it will open this page with the code pre-filled.
              </p>
            </div>
          </div>
        </div>

        {/* Invite Preview Card */}
        {inviteInfo && (
          <div className="mt-6 rounded-[2.5rem] bg-green-50 border-4 border-navy-900 shadow-playful p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-400 border-2 border-navy-900">
                <Building2 className="h-7 w-7 text-navy-900" />
              </div>
              <div>
                <p className="text-sm text-navy-500 font-bold">You&apos;ve been invited to join</p>
                <h2 className="text-2xl font-bold text-navy-900 font-display">
                  {inviteInfo.org_name}
                </h2>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-navy-500">Your role</span>
                <span className="font-bold text-navy-900">
                  {roleLabels[inviteInfo.target_role] || inviteInfo.target_role}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy-500">Invite for</span>
                <span className="font-bold text-navy-900">{inviteInfo.email}</span>
              </div>
            </div>

            <Button
              onClick={handleJoin}
              loading={joining}
              className="w-full rounded-full border-4 border-navy-900 bg-green-400 text-navy-900 font-bold shadow-playful hover:-translate-y-1 transition-all text-lg py-3"
            >
              {isAuthenticated ? (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Join {inviteInfo.org_name}
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Register & Join
                </>
              )}
            </Button>

            {!isAuthenticated && (
              <p className="text-center text-xs text-navy-400 mt-3">
                Already have an account?{" "}
                <Link href={`/auth/login?redirect=/join?code=${inviteInfo.short_code}`} className="text-navy-900 font-bold underline">
                  Log in first
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Back link */}
        <p className="text-center mt-6 text-sm text-navy-400">
          <Link href="/" className="hover:text-navy-900 underline transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
