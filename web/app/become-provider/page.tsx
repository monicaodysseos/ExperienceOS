"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import {
  DollarSign,
  Calendar,
  Users,
  Star,
  Shield,
  TrendingUp,
  ChevronDown,
  ArrowRight,
  Globe,
  MessageCircle,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Keep More Earnings",
    description:
      "Our low platform fee means you keep the majority of what you earn. Get paid weekly via Stripe.",
  },
  {
    icon: Calendar,
    title: "Flexible Schedule",
    description:
      "Set your own dates, times, and group sizes. Host when it works for you.",
  },
  {
    icon: Users,
    title: "Reach New Guests",
    description:
      "We bring tourists and locals looking for authentic experiences directly to your listing.",
  },
  {
    icon: Globe,
    title: "Global Visibility",
    description:
      "Your experiences are discoverable by travelers planning trips to Cyprus from around the world.",
  },
  {
    icon: MessageCircle,
    title: "Direct Communication",
    description:
      "Chat with guests before and after bookings to provide a personal touch.",
  },
  {
    icon: BarChart3,
    title: "Insights & Analytics",
    description:
      "Track your bookings, earnings, and reviews from your provider dashboard.",
  },
];

const FAQS = [
  {
    q: "Who can become a provider?",
    a: "Anyone with a passion or skill to share! Whether you're a professional chef, a certified guide, an artist, or just someone who knows their city inside out — if you can create an engaging experience, you're welcome.",
  },
  {
    q: "How much does it cost to list?",
    a: "Listing your experience is completely free. We only charge a small service fee when you receive a booking, so you only pay when you earn.",
  },
  {
    q: "How do I get paid?",
    a: "Payments are processed through Stripe Connect. You'll connect your bank account during setup, and earnings are deposited directly — typically within 2-3 business days after the experience.",
  },
  {
    q: "What if a guest cancels?",
    a: "Our cancellation policy protects both sides. Guests get a full refund if they cancel more than 48 hours before, 50% within 24-48 hours, and no refund within 24 hours. You'll be compensated accordingly.",
  },
  {
    q: "Can I set my own prices?",
    a: "Absolutely. You have full control over your pricing per person, group sizes, and time slots. We recommend researching similar experiences in your area for competitive pricing.",
  },
  {
    q: "How do reviews work?",
    a: "Only guests who actually attended your experience can leave a review. You can also respond to reviews publicly, which helps build trust with future guests.",
  },
];

const STEPS = [
  { num: "01", title: "Create Your Profile", desc: "Tell guests about yourself and your expertise" },
  { num: "02", title: "List Your Experience", desc: "Add photos, details, pricing, and availability" },
  { num: "03", title: "Connect Stripe", desc: "Set up payments to receive earnings directly" },
  { num: "04", title: "Start Hosting", desc: "Welcome your first guests and build your reputation" },
];

function EarningsCalculator() {
  const [guests, setGuests] = useState(6);
  const [price, setPrice] = useState(45);
  const [sessions, setSessions] = useState(4);

  const monthly = guests * price * sessions;
  const platformFee = monthly * 0.1;
  const net = monthly - platformFee;

  return (
    <div className="rounded-[2rem] border-0 bg-white p-10 shadow-card ring-1 ring-sand-200 relative overflow-hidden">
      {/* Decorative top blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl -mr-10 -mt-10" />

      <h3 className="font-display text-2xl font-semibold tracking-tight text-navy-900">Earnings Calculator</h3>
      <p className="mt-2 text-base text-navy-500">
        See how much you could earn each month
      </p>

      <div className="mt-8 space-y-8 relative z-10">
        <div>
          <div className="flex items-center justify-between text-base mb-3">
            <label className="font-medium text-navy-700">Price per guest</label>
            <span className="font-semibold text-navy-900">&euro;{price}</span>
          </div>
          <input
            type="range"
            min={10}
            max={150}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-navy-900 bg-sand-200 rounded-full h-2 appearance-none outline-none focus:ring-2 focus:ring-navy-900 focus:ring-offset-2 transition-shadow"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-base mb-3">
            <label className="font-medium text-navy-700">Guests per session</label>
            <span className="font-semibold text-navy-900">{guests}</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full accent-navy-900 bg-sand-200 rounded-full h-2 appearance-none outline-none focus:ring-2 focus:ring-navy-900 focus:ring-offset-2 transition-shadow"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-base mb-3">
            <label className="font-medium text-navy-700">Sessions per month</label>
            <span className="font-semibold text-navy-900">{sessions}</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={sessions}
            onChange={(e) => setSessions(Number(e.target.value))}
            className="w-full accent-navy-900 bg-sand-200 rounded-full h-2 appearance-none outline-none focus:ring-2 focus:ring-navy-900 focus:ring-offset-2 transition-shadow"
          />
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-sand-50 p-6 ring-1 ring-sand-200 relative z-10">
        <div className="flex items-center justify-between text-base font-medium text-navy-600">
          <span>Gross revenue</span>
          <span>&euro;{monthly.toLocaleString()}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-base font-medium text-crimson-600">
          <span>Platform fee (10%)</span>
          <span>-&euro;{platformFee.toLocaleString()}</span>
        </div>
        <div className="mt-4 border-t border-sand-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-navy-900">Your earnings</span>
            <span className="text-3xl font-bold tracking-tight text-navy-900">
              &euro;{net.toLocaleString()}<span className="text-xl text-navy-500 font-medium">/mo</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-navy-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-medium text-navy-900">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-navy-400 transition-transform ${open ? "rotate-180" : ""
            }`}
        />
      </button>
      {open && (
        <div className="pb-5 text-sm leading-relaxed text-navy-600">{a}</div>
      )}
    </div>
  );
}

export default function BecomeProviderPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-sand-100 py-32">
        <div className="absolute -top-40 right-10 w-[600px] h-[600px] bg-crimson-100/50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center rounded-full bg-crimson-50 px-4 py-1.5 text-sm font-semibold text-crimson-600 ring-1 ring-inset ring-crimson-200">
                Become a Provider
              </span>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-navy-900 sm:text-6xl tracking-tight">
                Turn Your Passion Into a Business
              </h1>
              <p className="mt-6 text-lg text-navy-600 leading-relaxed max-w-lg">
                Share what you love with visitors and locals in Cyprus.
                Create memorable experiences, set your own schedule, and
                start earning.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                {user ? (
                  <Link href="/dashboard/provider/onboarding">
                    <Button variant="primary" size="lg">
                      Start Onboarding
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/register?role=provider">
                    <Button variant="primary" size="lg">
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href="/how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/50 backdrop-blur-sm"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm font-medium text-navy-600">
                <span className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-crimson-50 text-crimson-500"><Zap className="h-3 w-3" /></div> Free to list
                </span>
                <span className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-crimson-50 text-crimson-500"><Shield className="h-3 w-3" /></div> Secure payments
                </span>
                <span className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-crimson-50 text-crimson-500"><TrendingUp className="h-3 w-3" /></div> Grow your reach
                </span>
              </div>
            </div>
            <div className="hidden lg:block relative z-10">
              <EarningsCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy-900">
              Get Started in 4 Simple Steps
            </h2>
            <p className="mt-3 text-navy-500">
              From sign-up to your first booking in no time
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.num} className="text-center">
                <span className="text-4xl font-bold text-teal-200">
                  {step.num}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-navy-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-navy-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-sand-50 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-display text-4xl font-semibold text-navy-900 tracking-tight">
              Why Host on ExperienceOS?
            </h2>
            <p className="mt-4 text-lg text-navy-500">
              Everything you need to succeed as a host
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-sand-200 transition-all hover:-translate-y-1 hover:shadow-card hover:ring-sand-300"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 shadow-sm border border-teal-100">
                  <b.icon className="h-7 w-7 text-teal-600" />
                </div>
                <h3 className="mt-8 text-xl font-semibold text-navy-900">{b.title}</h3>
                <p className="mt-3 text-base text-navy-500 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator (mobile) */}
      <section className="py-20 lg:hidden">
        <div className="mx-auto max-w-lg px-4">
          <EarningsCalculator />
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-10 text-center text-white">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <p className="text-3xl font-bold">500+</p>
                <p className="mt-1 text-teal-100">Active Experiences</p>
              </div>
              <div>
                <p className="text-3xl font-bold">4.8</p>
                <div className="mt-1 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < 5 ? "fill-current text-amber-400" : "text-teal-300"}`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-teal-100">Average Rating</p>
              </div>
              <div>
                <p className="text-3xl font-bold">&euro;2,400</p>
                <p className="mt-1 text-teal-100">Avg Monthly Earnings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-sand-50 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-navy-500">
              Everything you need to know about hosting
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-navy-200 bg-white px-6">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-navy-900">
            Ready to Share Your Passion?
          </h2>
          <p className="mt-3 text-navy-500">
            Join our community of providers and start earning today. It&apos;s
            free to get started.
          </p>
          <div className="mt-8">
            {user ? (
              <Link href="/dashboard/provider/onboarding">
                <Button size="lg">
                  Start Onboarding
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth/register?role=provider">
                <Button size="lg">
                  Create Your Provider Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
