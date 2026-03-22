import Link from "next/link";
import { Star, Clock, MapPin, Users, Globe, Check, BadgeCheck } from "lucide-react";
import type { Metadata } from "next";
import { ImageGallery } from "@/components/ImageGallery";
import { BookingWidget } from "@/components/BookingWidget";
import { ContactHostButton } from "@/components/ContactHostButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ExperienceDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  what_included: string;
  what_to_bring: string;
  meeting_point: string;
  city: string;
  duration_minutes: number;
  price_per_person: string;
  min_participants: number;
  max_participants: number;
  languages: string[];
  average_rating: string;
  review_count: number;
  images: { id: number; image_url: string; is_cover: boolean }[];
  provider: {
    id: number;
    user_id: number;
    display_name: string;
    bio: string;
    tagline: string;
    is_verified: boolean;
  };
  category: { name: string; slug: string };
}

async function getExperience(slug: string): Promise<ExperienceDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/experiences/${slug}/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exp = await getExperience(slug);
  if (!exp) return { title: "Experience not found" };

  return {
    title: `${exp.title} — ExperienceOS`,
    description: exp.description.slice(0, 160),
    openGraph: {
      title: exp.title,
      description: exp.description.slice(0, 160),
      images: exp.images[0]?.image_url ? [exp.images[0].image_url] : [],
    },
  };
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exp = await getExperience(slug);

  if (!exp) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy-900">
          Experience not found
        </h1>
        <p className="mt-2 text-navy-500">
          This experience may have been removed or is no longer available.
        </p>
        <Link
          href="/experiences"
          className="mt-6 inline-block rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Browse all experiences
        </Link>
      </div>
    );
  }

  const durationText =
    exp.duration_minutes >= 60
      ? `${Math.floor(exp.duration_minutes / 60)}h${exp.duration_minutes % 60 ? ` ${exp.duration_minutes % 60}m` : ""}`
      : `${exp.duration_minutes}m`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-navy-500">
        <Link href="/" className="hover:text-teal-700">Home</Link>
        <span>/</span>
        <Link href="/experiences" className="hover:text-teal-700">
          Experiences
        </Link>
        <span>/</span>
        <span className="text-navy-900 line-clamp-1">{exp.title}</span>
      </nav>

      {/* Content Grid (Side-by-side layout) */}
      <div className="mt-8 grid gap-10 lg:grid-cols-12 items-start">
        {/* Left Column: Photos & Description */}
        <div className="lg:col-span-7 space-y-8">
          {/* Image Carousel / Gallery */}
          <ImageGallery images={exp.images} alt={exp.title} />

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-navy-900">
              About this experience
            </h2>
            <p className="mt-3 whitespace-pre-line text-navy-600 leading-relaxed">
              {exp.description}
            </p>
          </div>

          {/* What's Included */}
          {exp.what_included && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-navy-900">
                What&apos;s included
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {exp.what_included.split("\n").filter(Boolean).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg bg-teal-50/50 p-3 text-sm text-navy-700"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to Bring */}
          {exp.what_to_bring && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-navy-900">
                What to bring
              </h2>
              <p className="mt-3 whitespace-pre-line text-navy-600 leading-relaxed">
                {exp.what_to_bring}
              </p>
            </div>
          )}

          {/* Meeting Point */}
          {exp.meeting_point && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-navy-900">
                Meeting point
              </h2>
              <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-navy-50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-navy-400" />
                <p className="text-sm text-navy-600">{exp.meeting_point}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Booking Widget & Core Details */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          {/* Title & Meta */}
          <div>
            <span className="inline-flex items-center rounded-full bg-sand-200 px-3 py-1 font-bold text-ink-900 border-2 border-ink-900 shadow-playful">
              {exp.category.name}
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-ink-900 font-display">
              {exp.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-navy-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-ink-900" />
                {exp.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-ink-900" />
                {durationText}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-ink-900" />
                {exp.min_participants}-{exp.max_participants} people
              </span>
              {exp.languages.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-ink-900" />
                  {exp.languages.join(", ")}
                </span>
              )}
              {exp.review_count > 0 && (
                <span className="flex items-center gap-1.5 bg-yellow-400 px-2 py-0.5 rounded-md border-2 border-ink-900">
                  <Star className="h-4 w-4 fill-ink-900 text-ink-900" />
                  {parseFloat(exp.average_rating).toFixed(1)} ({exp.review_count}{" "}
                  review{exp.review_count !== 1 ? "s" : ""})
                </span>
              )}
            </div>
          </div>

          <BookingWidget
            slug={exp.slug}
            pricePerPerson={exp.price_per_person}
            minParticipants={exp.min_participants}
            maxParticipants={exp.max_participants}
          />

          {/* Provider Card */}
          <div className="mt-8 flex items-start gap-4 rounded-xl border-4 border-ink-900 bg-sand-100 p-5 shadow-playful">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-moss-400 border-2 border-ink-900 text-lg font-bold text-ink-900">
              {exp.provider.display_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-ink-900">
                  {exp.provider.display_name}
                </h3>
                {exp.provider.is_verified && (
                  <BadgeCheck className="h-4 w-4 text-ocean-600" />
                )}
              </div>
              {exp.provider.tagline && (
                <p className="mt-0.5 text-sm text-ink-900 font-medium opacity-80">
                  {exp.provider.tagline}
                </p>
              )}
              {exp.provider.bio && (
                <p className="mt-2 text-sm text-navy-700 leading-relaxed line-clamp-3">
                  {exp.provider.bio}
                </p>
              )}
              <div className="mt-3">
                <ContactHostButton
                  providerUserId={exp.provider.user_id}
                  experienceId={exp.id}
                  experienceSlug={exp.slug}
                  providerName={exp.provider.display_name}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
