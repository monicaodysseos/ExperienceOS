import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExperienceOS — Discover Unforgettable Experiences in Cyprus",
  description:
    "Book cooking classes, walking tours, yoga sessions, workshops and more transformative experiences across Cyprus. From Nicosia to Limassol.",
  keywords: ["Cyprus", "experiences", "tours", "workshops", "booking", "activities"],
  openGraph: {
    title: "ExperienceOS",
    description: "Discover and book unforgettable experiences in Cyprus.",
    type: "website",
    locale: "en_CY",
  },
};

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* PostHog — product analytics + session replay */}
        {POSTHOG_KEY && (
          <Script id="posthog-init" strategy="afterInteractive">{`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('${POSTHOG_KEY}',{api_host:'${POSTHOG_HOST}',person_profiles:'identified_only'});
          `}</Script>
        )}

        {/* Sentry — error tracking */}
        {SENTRY_DSN && (
          <Script id="sentry-init" strategy="afterInteractive">{`
            window.__SENTRY_DSN__ = '${SENTRY_DSN}';
          `}</Script>
        )}
      </head>
      <body className="min-h-screen bg-sand-50 text-navy-900 antialiased selection:bg-sand-300 selection:text-navy-900">
        <AuthProvider>
          <Toaster position="top-right" richColors closeButton />
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
