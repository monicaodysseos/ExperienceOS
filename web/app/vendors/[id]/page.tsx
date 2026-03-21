import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star,
  Clock,
  MapPin,
  Globe,
  Instagram,
  CheckCircle2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ProviderProfile {
  id: number;
  display_name: string;
  bio: string;
  tagline: string;
  website: string;
  instagram: string;
  is_verified: boolean;
}

interface ExperienceListItem {
  id: number;
  title: string;
  slug: string;
  city: string;
  duration_minutes: number;
  price_per_person: string;
  average_rating: string;
  review_count: number;
  cover_image: string | null;
  category: { name: string };
  min_participants: number;
  max_participants: number;
}

async function getProvider(id: string): Promise<ProviderProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/provider/${id}/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getProviderExperiences(providerId: string): Promise<ExperienceListItem[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/experiences/?provider=${providerId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VendorProfilePage({ params }: Props) {
  const { id } = await params;
  const [provider, experiences] = await Promise.all([
    getProvider(id),
    getProviderExperiences(id),
  ]);

  if (!provider) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-navy-500 mb-8">
        <Link href="/" className="hover:text-teal-700">Home</Link>
        <span>/</span>
        <Link href="/experiences" className="hover:text-teal-700">Experiences</Link>
        <span>/</span>
        <span className="text-navy-900">{provider.display_name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-6 mb-10">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-navy-100 text-navy-400 text-3xl font-bold">
          {provider.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold text-navy-900">
              {provider.display_name}
            </h1>
            {provider.is_verified && (
              <span className="flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-200">
                <CheckCircle2 className="h-3 w-3" />
                Verified provider
              </span>
            )}
          </div>
          {provider.tagline && (
            <p className="mt-1 text-lg text-navy-500">{provider.tagline}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-navy-500">
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-teal-700 transition-colors"
              >
                <Globe className="h-4 w-4" />
                Website
              </a>
            )}
            {provider.instagram && (
              <a
                href={`https://instagram.com/${provider.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-teal-700 transition-colors"
              >
                <Instagram className="h-4 w-4" />
                @{provider.instagram.replace("@", "")}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {provider.bio && (
        <div className="mb-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200">
          <h2 className="font-semibold text-navy-900 mb-2">About</h2>
          <p className="text-navy-600 whitespace-pre-line leading-relaxed">{provider.bio}</p>
        </div>
      )}

      {/* Experiences */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-navy-900 mb-6">
          Experiences by {provider.display_name}
          <span className="ml-2 text-base font-normal text-navy-400">
            ({experiences.length})
          </span>
        </h2>

        {experiences.length === 0 ? (
          <p className="text-navy-500">No active experiences at the moment.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((exp) => (
              <Link
                key={exp.id}
                href={`/experiences/${exp.slug}`}
                className="group overflow-hidden rounded-xl border border-navy-200 bg-white transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-navy-100">
                  {exp.cover_image ? (
                    <Image
                      src={exp.cover_image}
                      alt={exp.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-navy-300">
                      <MapPin className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-teal-700 backdrop-blur-sm">
                      {exp.category.name}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-navy-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
                    {exp.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-3 text-xs text-navy-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {exp.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exp.duration_minutes >= 60
                        ? `${Math.floor(exp.duration_minutes / 60)}h`
                        : `${exp.duration_minutes}m`}
                    </span>
                    {exp.review_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {parseFloat(exp.average_rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-navy-900">
                      €{parseFloat(exp.price_per_person).toFixed(0)}
                    </span>
                    <span className="text-sm text-navy-500">/ person</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
