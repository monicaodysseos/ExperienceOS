"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, Compass } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const login = useAuth((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      // Validate redirect to prevent open redirect attacks
      const safeRedirect = redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/dashboard";
      router.push(safeRedirect);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen bg-sand-50 selection:bg-purple-200 selection:text-navy-900">
      {/* Left Panel - Brand */}
      <div className="hidden w-1/2 lg:flex lg:flex-col lg:justify-center bg-sand-100 p-16 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-crimson-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="relative z-10 max-w-md bg-white rounded-[2rem] p-12 shadow-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-10 shadow-sm border border-purple-100">
            <Compass className="h-8 w-8" />
          </div>
          <h2 className="font-display text-4xl font-semibold leading-[1.1] text-navy-900 mb-6">
            Welcome back to your next adventure
          </h2>
          <p className="text-lg text-navy-500 leading-relaxed mb-10">
            Sign in to access your bookings, messages, and discover new
            experiences across Cyprus.
          </p>
          <div className="flex gap-4">
            <div className="bg-sand-50 rounded-2xl p-5 flex-1 ring-1 ring-sand-200 shadow-sm">
              <p className="font-display text-3xl font-semibold text-crimson-600 mb-1">500+</p>
              <p className="text-sm font-medium text-navy-500">Experiences</p>
            </div>
            <div className="bg-sand-50 rounded-2xl p-5 flex-1 ring-1 ring-sand-200 shadow-sm">
              <p className="font-display text-3xl font-semibold text-crimson-600 mb-1">50+</p>
              <p className="text-sm font-medium text-navy-500">Local Hosts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-sm ring-1 ring-sand-200 relative">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-navy-900 mb-2">
            Sign in
          </h1>
          <p className="text-base text-navy-500 mb-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-crimson-600 hover:text-crimson-700 transition-colors"
            >
              Sign up for free
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-navy-400 hover:text-navy-900 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-crimson-600 hover:text-crimson-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <div className="relative mt-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sand-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-navy-500">
                or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toast.error("Google Sign-In is not yet available. Please use email and password.")}
            className="mt-8 flex w-full items-center justify-center gap-3 bg-white px-4 py-3 text-base font-medium text-navy-700 rounded-xl ring-1 ring-inset ring-sand-200 shadow-sm transition-all hover:bg-sand-50 hover:shadow-md"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
