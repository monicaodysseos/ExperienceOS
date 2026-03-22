import Link from "next/link";
import {
  Search,
  MapPin,
  Calendar,
  Heart,
  Shield,
  Star,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Users,
  BadgeCheck,
  Clock,
} from "lucide-react";

const CATEGORIES = [
  { name: "Workshops", slug: "workshops", icon: "🔨", gradient: "from-orange-400 to-orange-600" },
  { name: "Tours", slug: "tours", icon: "🚶", gradient: "from-blue-400 to-blue-600" },
  { name: "Wellness", slug: "wellness", icon: "🧘", gradient: "from-purple-400 to-pink-500" },
  { name: "Food & Drink", slug: "food-drink", icon: "🍽️", gradient: "from-red-400 to-red-600" },
  { name: "Outdoor", slug: "outdoor", icon: "🌿", gradient: "from-green-400 to-green-600" },
  { name: "Nightlife", slug: "nightlife", icon: "🌙", gradient: "from-dark-green-500 to-dark-green-700" },
  { name: "Learning", slug: "learning", icon: "📚", gradient: "from-yellow-400 to-yellow-600" },
  { name: "Arts", slug: "arts", icon: "🎨", gradient: "from-light-green-400 to-light-green-600" },
  { name: "Music", slug: "music", icon: "🎵", gradient: "from-purple-500 to-purple-700" },
  { name: "Games", slug: "games", icon: "🎮", gradient: "from-blue-500 to-blue-700" },
];

const TESTIMONIALS = [
  {
    name: "Maria K.",
    rating: 5,
    text: "The pottery workshop in Nicosia was absolutely magical. Our host was so warm and talented — I made my first vase!",
    experience: "Traditional Pottery Workshop",
  },
  {
    name: "James T.",
    rating: 5,
    text: "Best sunset tour in Limassol! Our guide knew every hidden spot. Worth every penny and more.",
    experience: "Secret Sunset Coastal Walk",
  },
  {
    name: "Elena S.",
    rating: 5,
    text: "We did the Cypriot cooking class as a team outing. Everyone is still talking about it two months later!",
    experience: "Cypriot Village Cooking Class",
  },
];

export default function HomePage() {
  return (
    <div className="bg-sand-50">
      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-sand-50 pt-24 pb-32 sm:pt-32 sm:pb-40">
        {/* VIVI DO colorful background gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-green-300 to-light-green-400 opacity-40 blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/2 -ml-40 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-orange-400 to-yellow-300 opacity-30 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 flex flex-col items-center">
          <div className="mx-auto max-w-5xl text-center z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-navy-900 border-2 border-navy-900 shadow-playful mb-10 transition-transform hover:scale-105 cursor-default">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>New experiences added weekly</span>
            </div>

            <h1 className="font-display text-6xl font-bold tracking-tight text-navy-900 sm:text-7xl lg:text-8xl leading-[1.1] ">
              Discover unforgettable <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 bg-clip-text text-transparent relative whitespace-nowrap drop-shadow-sm">
                experiences
              </span>
              {" "}in Cyprus
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-xl font-medium text-navy-700 leading-relaxed">
              From hidden village cooking classes to sunset yacht tours — find
              your next adventure with local experts who know Cyprus best.
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-16 max-w-4xl">
              <form action="/experiences" method="GET">
                <div className="flex flex-col sm:flex-row rounded-3xl sm:rounded-full bg-white border-4 border-navy-900 shadow-playful p-2 gap-2 transition-transform hover:-translate-y-1">
                  <div className="flex flex-1 items-center gap-3 px-4 py-3 sm:py-0 border-b-2 border-sand-200 sm:border-b-0 sm:border-r-2">
                    <Search className="h-5 w-5 text-navy-400" />
                    <input
                      type="text"
                      name="search"
                      placeholder="What do you want to experience?"
                      className="flex-1 bg-transparent text-lg text-navy-900 placeholder-navy-400 outline-none"
                    />
                  </div>
                  <div className="flex items-center px-4 py-3 sm:py-0">
                    <MapPin className="h-5 w-5 text-navy-400 mr-2" />
                    <select
                      name="city"
                      className="flex-1 text-lg text-navy-900 outline-none bg-transparent cursor-pointer"
                    >
                      <option value="">All Cities</option>
                      <option value="nicosia">Nicosia</option>
                      <option value="limassol">Limassol</option>
                      <option value="paphos">Paphos</option>
                      <option value="larnaca">Larnaca</option>
                      <option value="ayia-napa">Ayia Napa</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-orange-500 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-orange-600 shadow-playful hover:shadow-playful-hover border-2 border-navy-900"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-navy-600">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Shield className="h-4 w-4" />
                </div>
                Verified Providers
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <BadgeCheck className="h-4 w-4" />
                </div>
                Secure Payments
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
                Free Cancellation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────── */}
      <section className="bg-white py-24 sm:py-32 border-t border-sand-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy-900 tracking-tight">How it works</h2>
            <p className="mt-4 text-lg text-navy-500 max-w-2xl mx-auto">Discovering your next unforgettable moment in Cyprus is simpler than ever.</p>
          </div>

          <div className="grid gap-12 sm:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Browse",
                desc: "Explore hundreds of unique experiences across Cyprus, curated by passionate locals.",
                color: "bg-blue-300 text-navy-900 border-navy-900",
                iconBg: "bg-white",
                iconColor: "text-blue-600",
              },
              {
                icon: Calendar,
                title: "Book",
                desc: "Pick your perfect date and time, invite your friends, and check out securely.",
                color: "bg-orange-300 text-navy-900 border-navy-900",
                iconBg: "bg-white",
                iconColor: "text-orange-600",
              },
              {
                icon: Heart,
                title: "Experience",
                desc: "Show up, meet your host, and create incredible memories that last a lifetime.",
                color: "bg-green-300 text-navy-900 border-navy-900",
                iconBg: "bg-white",
                iconColor: "text-green-600",
              },
            ].map((step, i) => (
              <div key={step.title} className={`relative p-8 rounded-[2rem] border-4 ${step.color} transition-all duration-300 shadow-playful hover:shadow-playful-hover hover:-translate-y-2`}>
                <div className={`flex h-16 w-16 mb-8 items-center justify-center rounded-full border-2 border-navy-900 shadow-playful ${step.iconBg} ${step.iconColor}`}>
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="font-display text-3xl font-bold mb-3">{step.title}</h3>
                <p className="text-lg font-medium leading-relaxed opacity-90">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ────────────────────────────────────── */}
      <section className="py-24 bg-sand-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy-900 tracking-tight">Explore by Category</h2>
            </div>
            <Link
              href="/experiences"
              className="mt-6 md:mt-0 inline-flex items-center gap-2 bg-white text-navy-900 px-6 py-3 font-medium rounded-full ring-1 ring-sand-200 shadow-sm hover:shadow-md transition-all hover:ring-sand-300"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-5">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/experiences?category=${cat.slug}`}
                className={`group relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${cat.gradient} p-6 flex flex-col items-center justify-center transition-all duration-300 shadow-playful hover:shadow-playful-hover hover:-translate-y-2 border-4 border-navy-900`}
              >
                <span className="text-5xl sm:text-6xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-md">{cat.icon}</span>
                <p className="text-xl font-bold text-white text-center ">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── City Spotlights ───────────────────────────────── */}
      <section className="bg-sand-100 py-32 rounded-[2rem] sm:rounded-[4rem] mx-4 sm:mx-6 my-12 lg:mx-12 overflow-hidden relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-navy-900 tracking-tight">
              Explore Cities
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/experiences?city=nicosia"
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-red-700 p-10 text-white transition-all duration-500 hover:shadow-floating lg:row-span-2 flex flex-col justify-end min-h-[400px]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent opacity-60" />
              <div className="relative z-10">
                <h3 className="font-display text-4xl sm:text-5xl font-semibold mb-4">Nicosia</h3>
                <p className="text-lg text-white/90 leading-relaxed max-w-sm">
                  The capital city — culture, food, history, and the best workshops on the island.
                </p>
                <div className="mt-8 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md group-hover:bg-white text-white group-hover:text-red-700 transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </Link>

            <Link
              href="/experiences?city=limassol"
              className="group rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-8 text-white transition-all duration-300 hover:shadow-card hover:-translate-y-1 flex flex-col justify-between min-h-[240px]"
            >
              <h3 className="font-display text-3xl font-semibold">Limassol</h3>
              <p className="text-base text-white/90 mt-4 max-w-xs">Seaside vibes — wellness, yacht tours, and nightlife</p>
            </Link>

            <Link
              href="/experiences?city=paphos"
              className="group rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 p-8 text-white transition-all duration-300 hover:shadow-card hover:-translate-y-1 flex flex-col justify-between min-h-[240px]"
            >
              <h3 className="font-display text-3xl font-semibold">Paphos</h3>
              <p className="text-base text-white/90 mt-4 max-w-xs">Ancient ruins, coastal hikes, and wine tasting</p>
            </Link>

            <Link
              href="/experiences?city=larnaca"
              className="group rounded-3xl bg-gradient-to-br from-purple-400 to-pink-500 p-8 text-white transition-all duration-300 hover:shadow-card hover:-translate-y-1 flex flex-col justify-between min-h-[200px]"
            >
              <h3 className="font-display text-2xl font-semibold">Larnaca</h3>
              <p className="text-sm text-white/90 mt-2">Salt lake, flamingos, diving</p>
            </Link>

            <Link
              href="/experiences?city=ayia-napa"
              className="group rounded-3xl bg-gradient-to-br from-green-300 to-green-500 p-8 text-white transition-all duration-300 hover:shadow-card hover:-translate-y-1 flex flex-col justify-between min-h-[200px]"
            >
              <h3 className="font-display text-2xl font-semibold">Ayia Napa</h3>
              <p className="text-sm text-white/90 mt-2">Beach adventures & water sports</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────── */}
      <section className="bg-sand-50 py-24 object-contain">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy-900 tracking-tight">
              What People Say
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-playful border-4 border-navy-900"
              >
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-current text-yellow-500" />
                  ))}
                </div>
                <p className="text-xl font-medium text-navy-800 leading-relaxed mb-8">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full border-2 border-navy-900 bg-purple-300 flex items-center justify-center text-navy-900 font-bold text-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-navy-900">{t.name}</p>
                    <p className="text-sm font-medium text-navy-500">{t.experience}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Become a Provider CTA ─────────────────────────── */}
      <section className="bg-sand-50 py-32 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[3rem] bg-navy-900 p-10 sm:p-20 relative overflow-hidden">
            {/* Background Soft Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />

            <div className="grid gap-16 lg:grid-cols-2 items-center relative z-10">
              <div>
                <h2 className="font-display text-5xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-8 ">
                  Share Your<br />Passion
                </h2>
                <p className="text-xl font-medium text-purple-100 leading-relaxed mb-10 max-w-lg">
                  Join our community of local experts in Cyprus. Create unique experiences, set your own schedule, and start earning doing what you love.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register?role=provider" className="inline-flex items-center justify-center gap-2 bg-yellow-400 border-2 border-navy-900 px-8 py-4 text-lg font-bold text-navy-900 rounded-full shadow-playful hover:shadow-playful-hover hover:-translate-y-1 transition-all">
                    Start Hosting <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link href="/become-provider" className="inline-flex items-center justify-center gap-2 bg-white/10 px-8 py-4 text-lg font-bold text-white border-2 border-transparent rounded-full hover:bg-white/20 transition-all backdrop-blur-sm">
                    Learn More
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                  { label: "Set your own schedule", icon: Calendar, color: "bg-gradient-to-br from-blue-400 to-blue-600 text-white", iconColor: "text-white bg-white/20" },
                  { label: "Get paid securely", icon: Shield, color: "bg-gradient-to-br from-green-400 to-green-600 text-white", iconColor: "text-white bg-white/20" },
                  { label: "Free to list", icon: Sparkles, color: "bg-gradient-to-br from-purple-400 to-purple-600 text-white", iconColor: "text-white bg-white/20" },
                  { label: "Marketing support", icon: Heart, color: "bg-gradient-to-br from-orange-400 to-orange-600 text-white", iconColor: "text-white bg-white/20" },
                ].map((item, i) => (
                  <div key={item.label} className={`rounded-xl sm:rounded-2xl p-6 sm:p-8 flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${item.color}`}>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-6 ${item.iconColor}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-lg leading-snug">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
