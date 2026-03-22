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
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <img src="/vivido-logo.jpg" alt="ViVi DO Creative Activities" className="h-28 w-28 object-contain mix-blend-multiply" />
        </Link>
      </div>
      {children}
    </div>
  );
}
