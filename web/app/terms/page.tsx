import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-navy-900">Terms of Service</h1>
      <p className="mt-4 text-navy-500">Last updated: March 2026</p>

      <div className="mt-8 space-y-6 text-navy-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-navy-900">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using ExperienceOS, you agree to be bound by these Terms of Service. If you
            do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">2. User Accounts</h2>
          <p className="mt-2">
            You must provide accurate information when creating an account. You are responsible for
            maintaining the security of your account credentials and for all activities under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">3. Bookings & Payments</h2>
          <p className="mt-2">
            All bookings are subject to availability. Payments are processed securely through Stripe.
            Cancellation policies apply as described at the time of booking: full refund more than 48 hours
            before, 50% refund within 24-48 hours, no refund within 24 hours.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">4. Provider Responsibilities</h2>
          <p className="mt-2">
            Providers are responsible for the accuracy of their listings, delivering experiences as
            described, maintaining appropriate insurance and licenses, and complying with local regulations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">5. Prohibited Conduct</h2>
          <p className="mt-2">
            Users may not use the platform for unlawful purposes, post misleading content, harass other
            users, attempt to circumvent the payment system, or interfere with the operation of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">6. Limitation of Liability</h2>
          <p className="mt-2">
            ExperienceOS acts as a marketplace connecting providers and guests. We are not liable for the
            quality or safety of experiences. Use the platform at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">7. Contact</h2>
          <p className="mt-2">
            For questions about these terms, please contact us at legal@experienceos.com.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-sm font-medium text-teal-700 hover:text-teal-800">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
