"use client";

import Link from "next/link";
import {
  Search,
  CalendarCheck,
  Sparkles,
  UserPlus,
  ListPlus,
  Banknote,
  ArrowRight,
  Star,
  Shield,
  Clock,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const EXPLORER_STEPS = [
  {
    icon: Search,
    title: "Browse Experiences",
    description:
      "Discover hundreds of unique activities across Cyprus — from cooking classes and wine tours to mountain hikes and pottery workshops.",
  },
  {
    icon: CalendarCheck,
    title: "Book Instantly",
    description:
      "Pick your date, choose a time slot, select the number of guests, and book securely with Stripe. No hidden fees.",
  },
  {
    icon: Sparkles,
    title: "Live It",
    description:
      "Show up and enjoy! Your host handles everything. After your experience, leave a review to help other explorers.",
  },
];

const PROVIDER_STEPS = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description:
      "Sign up as a provider and tell guests about yourself — your expertise, your story, and what makes your experiences special.",
  },
  {
    icon: ListPlus,
    title: "List Your Experience",
    description:
      "Add photos, descriptions, pricing, and time slots. Our tools make it easy to manage your calendar and bookings.",
  },
  {
    icon: Banknote,
    title: "Start Earning",
    description:
      "Get paid directly to your bank account via Stripe. We handle payments, messaging, and reviews so you can focus on hosting.",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Secure Payments",
    description: "All payments are processed through Stripe with buyer protection.",
  },
  {
    icon: Clock,
    title: "Flexible Cancellation",
    description: "Full refund up to 48 hours before. 50% refund within 24-48 hours.",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description: "Only guests who actually attended can leave reviews.",
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    description: "Chat directly with your host before and after booking.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-sand-50 to-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl">
            How ExperienceOS Works
          </h1>
          <p className="mt-4 text-lg text-navy-500">
            Whether you want to explore or host — we make it simple.
          </p>
        </div>
      </section>

      {/* For Explorers */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-block rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-700">
              For Explorers
            </span>
            <h2 className="mt-4 text-3xl font-bold text-navy-900">
              Find & Book Amazing Experiences
            </h2>
            <p className="mt-3 text-navy-500">
              Three simple steps to your next adventure
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {EXPLORER_STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < EXPLORER_STEPS.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-teal-200 to-transparent md:block" />
                )}
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-teal-50">
                  <step.icon className="h-10 w-10 text-teal-600" />
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-navy-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-navy-500">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/experiences">
              <Button size="lg">
                Browse Experiences
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section className="bg-navy-900 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-block rounded-full bg-coral-500/20 px-4 py-1.5 text-sm font-medium text-coral-400">
              For Providers
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white">
              Share Your Passion & Earn
            </h2>
            <p className="mt-3 text-navy-300">
              Turn what you love into a thriving experience business
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {PROVIDER_STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < PROVIDER_STEPS.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-navy-700 to-transparent md:block" />
                )}
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-navy-800">
                  <step.icon className="h-10 w-10 text-coral-400" />
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-coral-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-navy-300">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/become-provider">
              <Button variant="secondary" size="lg">
                Start Hosting
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy-900">
              Built for Trust & Simplicity
            </h2>
            <p className="mt-3 text-navy-500">
              Everything you need for a great experience
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-navy-200 bg-white p-6 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-100">
                  <f.icon className="h-6 w-6 text-navy-700" />
                </div>
                <h3 className="mt-4 font-semibold text-navy-900">{f.title}</h3>
                <p className="mt-2 text-sm text-navy-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-700 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="mt-3 text-teal-100">
            Join thousands discovering the best of Cyprus
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/experiences">
              <Button
                size="lg"
                className="bg-white text-teal-700 hover:bg-sand-50"
              >
                Explore Experiences
              </Button>
            </Link>
            <Link href="/become-provider">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Become a Provider
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
