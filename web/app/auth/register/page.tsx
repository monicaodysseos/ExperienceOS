"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Compass,
  Sparkles,
  Briefcase,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
    gdpr_accepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the privacy policy" }),
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

type Role = "explorer" | "provider" | "hr_manager" | null;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerUser = useAuth((s) => s.register);
  const [role, setRole] = useState<Role>(
    searchParams.get("role") === "provider" ? "provider" : null
  );
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { gdpr_accepted: false as unknown as true },
  });

  const password = watch("password", "");
  const gdprAccepted = watch("gdpr_accepted");

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
    if (score <= 3) return { label: "Medium", color: "bg-amber-500", width: "66%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        role: role === "provider" ? "provider" : role === "hr_manager" ? "hr_manager" : "participant",
        gdpr_accepted: true,
      });
      toast.success("Welcome to ExperienceOS!");
      // Redirect to verify-email notice (email is queued automatically on register)
      if (role === "provider") {
        router.push("/dashboard/provider/onboarding");
      } else if (role === "hr_manager") {
        router.push("/auth/verify-email");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    }
  };

  // Step 1: Role Selection
  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sand-50 px-6 py-16">
        <div className="w-full max-w-4xl">
          <h1 className="text-center font-display text-5xl font-semibold tracking-tight text-navy-900 md:text-6xl">
            Choose Your Path
          </h1>
          <p className="mt-4 text-center text-lg text-navy-500">
            You can always change this later
          </p>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {/* Explorer Card */}
            <button
              onClick={() => setRole("explorer")}
              className="group rounded-[2.5rem] bg-orange-400 p-8 text-left border-4 border-navy-900 shadow-playful transition-all hover:-translate-y-2 hover:shadow-playful-hover"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-navy-900 border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] transition-transform group-hover:scale-110">
                <Compass className="h-8 w-8" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold leading-tight text-navy-900 ">
                Join as<br />Explorer
              </h2>
              <p className="mt-3 text-sm font-medium text-navy-600 leading-relaxed">
                Discover and book unique experiences across Cyprus.
              </p>
              <div className="mt-6 space-y-3">
                {["Browse 500+ experiences", "Easy booking & payments", "Free cancellation"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm font-medium text-navy-800">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-crimson-50 text-crimson-600">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </button>

            {/* HR Manager Card */}
            <button
              onClick={() => setRole("hr_manager")}
              className="group rounded-[2.5rem] bg-light-green-400 p-8 text-left border-4 border-navy-900 shadow-playful transition-all hover:-translate-y-2 hover:shadow-playful-hover"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-navy-900 border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] transition-transform group-hover:scale-110">
                <Briefcase className="h-8 w-8" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold leading-tight text-navy-900 ">
                HR Manager<br />/ Team Lead
              </h2>
              <p className="mt-3 text-sm font-medium text-navy-300 leading-relaxed">
                Book team experiences, manage corporate accounts, and get B2B invoices.
              </p>
              <div className="mt-6 space-y-3">
                {["Group booking for teams", "B2B invoices with VAT", "Spend analytics"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm font-medium text-white">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </button>

            {/* Provider Card */}
            <button
              onClick={() => setRole("provider")}
              className="group rounded-[2.5rem] bg-purple-400 p-8 text-left border-4 border-navy-900 shadow-playful transition-all hover:-translate-y-2 hover:shadow-playful-hover"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-navy-900 border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] transition-transform group-hover:scale-110">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold leading-tight text-navy-900 ">
                Become a<br />Provider
              </h2>
              <p className="mt-3 text-sm font-medium text-crimson-100 leading-relaxed">
                Share your passion and earn by hosting unforgettable experiences.
              </p>
              <div className="mt-6 space-y-3">
                {["Set your own schedule", "Get paid via Stripe", "Free to list"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm font-medium text-white">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </button>
          </div>

          <p className="mt-16 text-center text-base font-medium text-navy-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-medium text-navy-900 shadow-sm ring-1 ring-sand-200 transition-colors hover:bg-sand-50 hover:shadow-md"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Registration Form
  return (
    <div className="flex min-h-screen bg-sand-50 selection:bg-purple-200 selection:text-navy-900">
      {/* Left Panel - Brand */}
      <div
        className={cn(
          "hidden w-1/2 lg:flex lg:flex-col lg:justify-center p-16 relative overflow-hidden",
          role === "provider"
            ? "bg-purple-400"
            : role === "hr_manager"
            ? "bg-light-green-400"
            : "bg-orange-400"
        )}
      >
        {/* Abstract Background Shapes */}
        <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-white blob-shape-1 opacity-20 pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-white blob-shape-2 opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-md bg-white rounded-[3rem] p-12 border-4 border-navy-900 shadow-playful">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-navy-900 mb-10 border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)]">
            {role === "provider" ? (
              <Sparkles className="h-8 w-8" />
            ) : role === "hr_manager" ? (
              <Briefcase className="h-8 w-8" />
            ) : (
              <Compass className="h-8 w-8" />
            )}
          </div>
          <h2 className="font-display text-4xl font-bold leading-[1.1] mb-6 text-navy-900 ">
            {role === "provider"
              ? "Start sharing your passion"
              : role === "hr_manager"
              ? "Experiences for your whole team"
              : "Your next adventure"}
          </h2>
          <p className="text-lg leading-relaxed mb-6 font-bold text-navy-900 opacity-90">
            {role === "provider"
              ? "Join our community of local experts in Cyprus. Create unique experiences and start earning on your own schedule."
              : role === "hr_manager"
              ? "Book group experiences for your team, get B2B invoices with VAT, and track spend — all in one HR dashboard."
              : "Create your account to book cooking classes, walking tours, wellness sessions, and hundreds more experiences across Cyprus."}
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 py-12">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 border-4 border-navy-900 shadow-playful relative">
          <button
            onClick={() => setRole(null)}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-navy-500 hover:text-crimson-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to roles
          </button>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-navy-900 mb-2">
            Create Account
          </h1>
          <p className="text-base text-navy-500 mb-8">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-crimson-600 hover:text-crimson-700 transition-colors"
            >
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="John"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.first_name?.message}
                {...register("first_name")}
              />
              <Input
                label="Last name"
                placeholder="Doe"
                error={errors.last_name?.message}
                {...register("last_name")}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-navy-400 hover:text-navy-600"
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
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-navy-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          strength.color
                        )}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <span className="text-xs text-navy-500">
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm password"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />

            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="gdpr"
                checked={gdprAccepted || false}
                onChange={(e) =>
                  setValue("gdpr_accepted", e.target.checked as unknown as true, {
                    shouldValidate: true,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-navy-300 text-teal-700 focus:ring-teal-500"
              />
              <label htmlFor="gdpr" className="text-sm text-navy-600">
                I agree to the{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  className="text-teal-700 underline"
                >
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-teal-700 underline"
                >
                  Terms of Service
                </a>
              </label>
            </div>
            {errors.gdpr_accepted && (
              <p className="text-sm text-red-500">
                {errors.gdpr_accepted.message}
              </p>
            )}

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
              size="lg"
              variant={role === "provider" ? "secondary" : "primary"}
            >
              {role === "provider"
                ? "Create Provider Account"
                : role === "hr_manager"
                ? "Create HR Account"
                : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
