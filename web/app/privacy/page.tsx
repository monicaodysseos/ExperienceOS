import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-navy-900">Privacy Policy</h1>
      <p className="mt-4 text-navy-500">Last updated: March 2026</p>

      <div className="mt-8 space-y-6 text-navy-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-navy-900">1. Information We Collect</h2>
          <p className="mt-2">
            We collect information you provide directly, such as your name, email address, phone number,
            and payment details when you create an account, make a booking, or list an experience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">2. How We Use Your Information</h2>
          <p className="mt-2">
            We use your personal information to provide and improve our services, process bookings and
            payments, communicate with you, and ensure the safety and security of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">3. Information Sharing</h2>
          <p className="mt-2">
            We share your information only as necessary to facilitate bookings (e.g., sharing guest names
            with providers), process payments through Stripe, comply with legal obligations, or with your
            explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">4. Data Security</h2>
          <p className="mt-2">
            We implement appropriate security measures to protect your personal information. Payment
            processing is handled by Stripe and we do not store your credit card details on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">5. Your Rights</h2>
          <p className="mt-2">
            You have the right to access, correct, or delete your personal data. You can manage your
            profile information through your account settings or contact us for assistance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">6. Contact</h2>
          <p className="mt-2">
            For privacy-related inquiries, please contact us at privacy@experienceos.com.
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
