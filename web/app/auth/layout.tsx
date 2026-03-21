import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sand-100">
      {/* Minimal auth header */}
      <div className="absolute left-0 right-0 top-0 z-10 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
            EO
          </div>
          <span className="text-lg font-bold text-navy-900">ExperienceOS</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
