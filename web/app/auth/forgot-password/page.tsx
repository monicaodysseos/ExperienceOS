"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.requestPasswordReset(email);
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link
          href="/auth/login"
          className="mb-8 flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        {submitted ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
              <CheckCircle2 className="h-8 w-8 text-teal-600" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-navy-900">
              Check your email
            </h1>
            <p className="mt-3 text-sm text-navy-500">
              If an account exists with <strong>{email}</strong>, we&apos;ve
              sent a password reset link. Please check your inbox.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="mt-8">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-navy-900">
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-navy-500">
              Enter the email address associated with your account and we&apos;ll
              send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Send Reset Link
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
