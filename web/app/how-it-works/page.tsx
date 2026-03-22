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
    <div className="bg-sand-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-sand-50 py-32 sm:py-40">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-green-300 to-light-green-400 opacity-40 blur-3xl pointer-events-none" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center z-10">
          <h1 className="font-display text-5xl sm:text-7xl font-bold text-navy-900  leading-[1.1]">
            How ExperienceOS Works
          </h1>
          <p className="mt-8 text-xl font-bold text-navy-700">
            Whether you want to explore or host — we make it simple.
          </p>
        </div>
      </section>

      {/* For Explorers */}
      <section className="py-24 bg-white border-t-4 border-navy-900 relative border-b-4">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-block rounded-full bg-light-green-400 border-2 border-navy-900 px-6 py-2 text-base font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] -rotate-2">
              For Explorers
            </span>
            <h2 className="mt-8 font-display text-4xl sm:text-5xl font-bold text-navy-900 ">
              Find & Book Amazing Experiences
            </h2>
            <p className="mt-4 text-lg font-bold text-navy-500">
              Three simple steps to your next adventure
            </p>
          </div>

          <div className="mt-20 grid gap-12 md:grid-cols-3">
            {EXPLORER_STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center p-8 rounded-[2.5rem] border-4 border-navy-900 bg-blue-300 shadow-playful hover:shadow-playful-hover hover:-translate-y-2 transition-all">
                <div className="relative mx-auto flex h-20 w-20 mb-8 items-center justify-center rounded-3xl border-2 border-navy-900 bg-white shadow-[4px_4px_0_theme(colors.navy.900)]">
                  <step.icon className="h-10 w-10 text-blue-600 border-navy-900" />
                  <span className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-navy-900 bg-yellow-400 text-lg font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)]">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-navy-900">
                  {step.title}
                </h3>
                <p className="mt-4 text-base font-bold text-navy-800 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/experiences">
              <Button size="lg" className="rounded-full border-4 border-navy-900 bg-yellow-400 text-navy-900 font-bold shadow-[4px_4px_0_theme(colors.navy.900)] hover:-translate-y-1 transition-all !bg-yellow-400 hover:!bg-yellow-500 !text-navy-900">
                Browse Experiences
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section className="bg-sand-50 py-24 border-b-4 border-navy-900">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-block rounded-full bg-orange-400 border-2 border-navy-900 px-6 py-2 text-base font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] rotate-2">
              For Providers
            </span>
            <h2 className="mt-8 font-display text-4xl sm:text-5xl font-bold text-navy-900 ">
              Share Your Passion & Earn
            </h2>
            <p className="mt-4 text-lg font-bold text-navy-500">
              Turn what you love into a thriving experience business
            </p>
          </div>

          <div className="mt-20 grid gap-12 md:grid-cols-3">
            {PROVIDER_STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center p-8 rounded-[2.5rem] border-4 border-navy-900 bg-purple-300 shadow-playful hover:shadow-playful-hover hover:-translate-y-2 transition-all">
                <div className="relative mx-auto flex h-20 w-20 mb-8 items-center justify-center rounded-3xl border-2 border-navy-900 bg-white shadow-[4px_4px_0_theme(colors.navy.900)]">
                  <step.icon className="h-10 w-10 text-purple-600" />
                  <span className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-navy-900 bg-light-green-400 text-lg font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)]">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-navy-900">
                  {step.title}
                </h3>
                <p className="mt-4 text-base font-bold text-navy-800 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/become-provider">
              <Button size="lg" className="rounded-full border-4 border-navy-900 bg-orange-400 text-navy-900 font-bold shadow-[4px_4px_0_theme(colors.navy.900)] hover:-translate-y-1 transition-all !text-navy-900 !bg-orange-400 hover:!bg-orange-500">
                Start Hosting
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 bg-white border-b-4 border-navy-900">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-navy-900 ">
              Built for Trust & Simplicity
            </h2>
            <p className="mt-4 text-lg font-bold text-navy-500">
              Everything you need for a great experience
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, index) => {
              const colors = ["bg-blue-400", "bg-green-400", "bg-purple-400", "bg-yellow-400"];
              return (
              <div
                key={f.title}
                className={`rounded-[2rem] border-4 border-navy-900 bg-white p-8 text-center shadow-playful hover:shadow-playful-hover hover:-translate-y-1 transition-all group`}
              >
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-navy-900 ${colors[index % colors.length]} shadow-[4px_4px_0_theme(colors.navy.900)] group-hover:-translate-y-1 transition-transform`}>
                  <f.icon className="h-8 w-8 text-navy-900" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold text-navy-900">{f.title}</h3>
                <p className="mt-3 text-sm font-bold text-navy-600">{f.description}</p>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-900 py-32 px-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-3xl opacity-50" />

        <div className="mx-auto max-w-3xl text-center relative z-10">
          <h2 className="font-display text-5xl sm:text-6xl font-bold text-white  mb-8">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-xl font-bold text-white/80 max-w-xl mx-auto mb-12">
            Join thousands discovering the best of Cyprus
          </p>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <Link href="/experiences">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full border-4 border-navy-900 bg-yellow-400 text-navy-900 font-bold shadow-[4px_4px_0_theme(colors.navy.900)] hover:-translate-y-1 hover:shadow-[2px_2px_0_theme(colors.navy.900)] transition-all !bg-yellow-400 hover:!bg-yellow-500 !text-navy-900"
              >
                Explore Experiences
              </Button>
            </Link>
            <Link href="/become-provider">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full border-4 border-navy-900 bg-white text-navy-900 font-bold shadow-[4px_4px_0_theme(colors.navy.900)] hover:-translate-y-1 hover:shadow-[2px_2px_0_theme(colors.navy.900)] transition-all !bg-white hover:!bg-sand-100 !text-navy-900"
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
