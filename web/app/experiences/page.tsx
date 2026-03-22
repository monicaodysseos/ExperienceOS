import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, MapPin, Search, Users, Calendar } from "lucide-react";
import { MiniMap } from "@/components/map";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ExperienceListItem {
  id: number;
  title: string;
  slug: string;
  category: { name: string; slug: string };
  city: string;
  duration_minutes: number;
  price_per_person: string;
  average_rating: string;
  review_count: number;
  cover_image: string | null;
  provider_name: string;
  min_participants: number;
  max_participants: number;
}

const CITIES = ["Nicosia", "Limassol", "Paphos", "Larnaca", "Ayia Napa"];

const PRICE_RANGES = [
  { label: "Under €25", min: "0", max: "25" },
  { label: "€25–€50", min: "25", max: "50" },
  { label: "€50–€100", min: "50", max: "100" },
  { label: "€100+", min: "100", max: "" },
];

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest" },
  { value: "-average_rating", label: "Top rated" },
  { value: "-booking_count", label: "Most popular" },
  { value: "price_per_person", label: "Price: Low to high" },
  { value: "-price_per_person", label: "Price: High to low" },
];

async function getExperiences(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  if (params.city) p.set("city", params.city);
  if (params.category) p.set("category", params.category);
  if (params.q) p.set("q", params.q);
  if (params.ordering) p.set("ordering", params.ordering);
  if (params.min_price) p.set("min_price", params.min_price);
  if (params.max_price) p.set("max_price", params.max_price);
  if (params.group_size) p.set("group_size", params.group_size);
  if (params.date) p.set("date", params.date);
  if (params.page) p.set("page", params.page);

  const query = p.toString() ? `?${p.toString()}` : "";
  try {
    const res = await fetch(`${API_BASE}/api/v1/experiences/${query}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { results: [], count: 0 };
    return res.json();
  } catch {
    return { results: [], count: 0 };
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/categories/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function buildUrl(
  current: Record<string, string | undefined>,
  updates: Record<string, string | undefined>
): string {
  const merged = { ...current, ...updates };
  // Reset page on any filter change
  delete merged.page;
  const p = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  const q = p.toString();
  return `/experiences${q ? `?${q}` : ""}`;
}

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [data, categories] = await Promise.all([
    getExperiences(params),
    getCategories(),
  ]);
  const experiences: ExperienceListItem[] = data.results || [];
  const total: number = data.count || experiences.length;

  const activeFilters = [
    params.city && { key: "city", label: params.city },
    params.category && { key: "category", label: params.category },
    params.q && { key: "q", label: `"${params.q}"` },
    (params.min_price || params.max_price) && {
      key: "price",
      label: `€${params.min_price || 0}${params.max_price ? `–€${params.max_price}` : "+"}`,
      clear: { min_price: undefined, max_price: undefined },
    },
    params.group_size && { key: "group_size", label: `${params.group_size} people` },
    params.date && { key: "date", label: params.date },
  ].filter(Boolean) as { key: string; label: string; clear?: Record<string, undefined> }[];

  const pageTitle = params.q
    ? `Results for "${params.q}"`
    : params.city
      ? `Experiences in ${params.city}`
      : params.category
        ? `${params.category} Experiences`
        : "All Experiences";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-bold text-navy-500">
        <Link href="/" className="hover:text-blue-500 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-navy-900 px-3 py-1 bg-yellow-400 rounded-full border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)]">Experiences</span>
      </nav>

      {/* Header + search bar */}
      <div className="mt-8">
        <h1 className="font-display text-5xl font-black text-navy-900 title-shadow">{pageTitle}</h1>
        <p className="mt-4 text-lg font-bold text-navy-500">
          {total} experience{total !== 1 ? "s" : ""} found
        </p>

        {/* Search bar */}
        <form action="/experiences" method="GET" className="mt-4 flex gap-2 max-w-xl">
          {/* Preserve non-search params */}
          {params.city && <input type="hidden" name="city" value={params.city} />}
          {params.category && <input type="hidden" name="category" value={params.category} />}
          {params.ordering && <input type="hidden" name="ordering" value={params.ordering} />}
          {params.min_price && <input type="hidden" name="min_price" value={params.min_price} />}
          {params.max_price && <input type="hidden" name="max_price" value={params.max_price} />}
          {params.group_size && <input type="hidden" name="group_size" value={params.group_size} />}
          {params.date && <input type="hidden" name="date" value={params.date} />}

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              name="q"
              defaultValue={params.q}
              placeholder="Search experiences…"
              className="w-full rounded-full border-4 border-navy-900 shadow-playful bg-white pl-12 pr-4 py-3.5 text-base font-bold text-navy-900 placeholder-navy-400 focus:outline-none focus:-translate-y-1 transition-transform"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-orange-400 px-8 py-3.5 text-base font-black text-navy-900 border-4 border-navy-900 shadow-playful hover:shadow-playful-hover hover:-translate-y-1 transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {activeFilters.map((f) => (
            <Link
              key={f.key}
              href={buildUrl(params, f.clear ?? { [f.key]: undefined })}
              className="inline-flex items-center gap-2 rounded-full bg-light-green-400 px-4 py-1.5 text-sm font-bold text-navy-900 border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] hover:-translate-y-0.5 transition-transform"
            >
              {f.label} <span className="text-lg leading-none">&times;</span>
            </Link>
          ))}
          <Link
            href="/experiences"
            className="text-sm font-bold text-crimson-600 hover:text-crimson-700 transition-colors ml-2 underline decoration-2 underline-offset-4"
          >
            Clear all
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-4">
        {/* Filter Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">

            {/* Sort */}
            <div>
              <h3 className="text-sm font-semibold text-navy-900">Sort by</h3>
              <div className="mt-3 space-y-1">
                {SORT_OPTIONS.map((opt) => (
                  <Link
                    key={opt.value}
                    href={buildUrl(params, { ordering: opt.value })}
                    className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      (params.ordering ?? "-created_at") === opt.value
                        ? "bg-blue-400 font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] border-2 border-navy-900 -translate-y-0.5"
                        : "text-navy-600 font-bold hover:bg-sand-100 border-2 border-transparent hover:border-navy-200"
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* City */}
            <div>
              <h3 className="text-sm font-semibold text-navy-900">City</h3>
              <div className="mt-3 space-y-1">
                {CITIES.map((city) => {
                  const val = city.toLowerCase().replace(" ", "-");
                  return (
                    <Link
                      key={city}
                      href={buildUrl(params, { city: params.city === val ? undefined : val })}
                      className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        params.city === val
                          ? "bg-blue-400 font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] border-2 border-navy-900 -translate-y-0.5"
                          : "text-navy-600 font-bold hover:bg-sand-100 border-2 border-transparent hover:border-navy-200"
                      }`}
                    >
                      {city}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Category</h3>
                <div className="mt-3 space-y-1">
                  {categories.map((cat: { slug: string; name: string }) => (
                    <Link
                      key={cat.slug}
                      href={buildUrl(params, {
                        category: params.category === cat.slug ? undefined : cat.slug,
                      })}
                      className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        params.category === cat.slug
                          ? "bg-blue-400 font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] border-2 border-navy-900 -translate-y-0.5"
                          : "text-navy-600 font-bold hover:bg-sand-100 border-2 border-transparent hover:border-navy-200"
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div>
              <h3 className="text-sm font-semibold text-navy-900">Price per person</h3>
              <div className="mt-3 space-y-1">
                {PRICE_RANGES.map((range) => {
                  const active =
                    params.min_price === range.min &&
                    (params.max_price === range.max || (!params.max_price && !range.max));
                  return (
                    <Link
                      key={range.label}
                      href={buildUrl(params, {
                        min_price: active ? undefined : range.min,
                        max_price: active ? undefined : range.max || undefined,
                      })}
                      className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-blue-400 font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] border-2 border-navy-900 -translate-y-0.5"
                          : "text-navy-600 font-bold hover:bg-sand-100 border-2 border-transparent hover:border-navy-200"
                      }`}
                    >
                      {range.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Group size */}
            <div>
              <h3 className="text-sm font-semibold text-navy-900">Group size</h3>
              <div className="mt-3 space-y-1">
                {[
                  { label: "1–2 people", value: "2" },
                  { label: "3–5 people", value: "5" },
                  { label: "6–10 people", value: "10" },
                  { label: "11–20 people", value: "15" },
                  { label: "20+ people", value: "25" },
                ].map((opt) => (
                  <Link
                    key={opt.value}
                    href={buildUrl(params, {
                      group_size: params.group_size === opt.value ? undefined : opt.value,
                    })}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      params.group_size === opt.value
                        ? "bg-blue-400 font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] border-2 border-navy-900 -translate-y-0.5"
                        : "text-navy-600 font-bold hover:bg-sand-100 border-2 border-transparent hover:border-navy-200"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-navy-900">Date</h3>
              <form action="/experiences" method="GET">
                {/* Preserve other params */}
                {params.city && <input type="hidden" name="city" value={params.city} />}
                {params.category && <input type="hidden" name="category" value={params.category} />}
                {params.q && <input type="hidden" name="q" value={params.q} />}
                {params.ordering && <input type="hidden" name="ordering" value={params.ordering} />}
                {params.min_price && <input type="hidden" name="min_price" value={params.min_price} />}
                {params.max_price && <input type="hidden" name="max_price" value={params.max_price} />}
                {params.group_size && <input type="hidden" name="group_size" value={params.group_size} />}
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                  <input
                    type="date"
                    name="date"
                    defaultValue={params.date}
                    className="w-full rounded-xl border-2 border-navy-900 bg-white pl-9 pr-3 py-2 text-sm font-bold text-navy-900 focus:outline-none focus:shadow-[2px_2px_0_theme(colors.navy.900)] transition-shadow"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-3 w-full rounded-xl bg-yellow-400 border-2 border-navy-900 py-2 text-sm font-bold text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] hover:-translate-y-0.5 transition-transform"
                >
                  Apply date
                </button>
                {params.date && (
                  <Link
                    href={buildUrl(params, { date: undefined })}
                    className="mt-2 block text-center text-xs font-bold text-crimson-600 hover:text-crimson-800 underline decoration-2 underline-offset-2"
                  >
                    Clear date
                  </Link>
                )}
              </form>
            </div>
          </div>
        </aside>

        {/* Results grid */}
        <div className="lg:col-span-3">
          {experiences.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-100">
                <MapPin className="h-7 w-7 text-navy-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy-900">
                No experiences found
              </h3>
              <p className="mt-2 text-sm text-navy-500">
                Try adjusting your filters or check back soon.
              </p>
              <Link
                href="/experiences"
                className="mt-6 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {experiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.slug}`}
                  className="group overflow-hidden rounded-[2.5rem] border-4 border-navy-900 bg-white transition-all duration-300 shadow-playful hover:shadow-playful-hover hover:-translate-y-2 flex flex-col"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-navy-100 border-b-4 border-navy-900">
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
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex rounded-full bg-light-green-400 px-3 py-1 text-xs font-black text-navy-900 border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)]">
                        {exp.category.name}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-xl font-black text-navy-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                        {exp.title}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-navy-500">by {exp.provider_name}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-navy-600">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          {exp.city}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-purple-500" />
                          {exp.duration_minutes >= 60
                            ? `${Math.floor(exp.duration_minutes / 60)}h${exp.duration_minutes % 60 ? ` ${exp.duration_minutes % 60}m` : ""}`
                            : `${exp.duration_minutes}m`}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-blue-500" />
                          {exp.min_participants}–{exp.max_participants}
                        </span>
                        {exp.review_count > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {parseFloat(exp.average_rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex items-baseline gap-1.5 pt-4 border-t-2 border-dashed border-navy-200">
                      <span className="font-display text-2xl font-black text-navy-900">
                        €{parseFloat(exp.price_per_person).toFixed(0)}
                      </span>
                      <span className="text-sm font-bold text-navy-500">/ person</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.next || data.previous ? (
            <div className="mt-10 flex items-center justify-between">
              <div>
                {data.previous && (
                  <Link
                    href={buildUrl(params, {
                      page: String(parseInt(params.page ?? "1") - 1),
                    })}
                    className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50 transition-colors"
                  >
                    ← Previous
                  </Link>
                )}
              </div>
              <div>
                {data.next && (
                  <Link
                    href={buildUrl(params, {
                      page: String(parseInt(params.page ?? "1") + 1),
                    })}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Map Preview */}
      <div className="mt-10">
        <Suspense fallback={null}>
          <MiniMap />
        </Suspense>
      </div>
    </div>
  );
}
