import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | LetzSave Luxembourg',
  description: 'GDPR Data Protection and Privacy Policy for LetzSave.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-gray-900">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-12 shadow-sm space-y-10">
        
        {/* Header */}
        <div className="border-b border-gray-100 pb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-3">
            <span>🔒</span> Data Protection
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Last updated: November 2026 | Compliant with Regulation (EU) 2016/679 (GDPR) & Luxembourg Law
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">1.</span> Data Controller Identification
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LetzSave (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;), operating as a student Mini-Entreprise under the pedagogical framework of <strong>Jonk Entrepreneuren Luxembourg asbl</strong> at Athénée de Luxembourg (24 Bd Pierre Dupong, L-1430 Luxembourg), acts as the Data Controller for personal data processed through this website.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            For all data privacy inquiries or to exercise your GDPR rights, contact us directly at: <strong className="text-emerald-700">contact@letzsave.lu</strong>.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">2.</span> Personal Data We Collect
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
            <li>
              <strong>Account & Authentication Data:</strong> Email address, encrypted password hash (or Google OAuth profile identifier if signing in via Google), account role (`customer` or `restaurant`), and internal UUID.
            </li>
            <li>
              <strong>Restaurant Partner Details:</strong> Business name, physical pickup address, contact telephone number, verification status, and connected Stripe Express Account ID (`stripe_account_id`).
            </li>
            <li>
              <strong>Order & Transaction Records:</strong> Purchased food listing IDs, quantities, timestamps, Stripe Checkout Session IDs (`stripe_session_id`), 6-character pickup verification codes, and collection status.
            </li>
            <li>
              <strong>Server & Security Logs:</strong> IP addresses, HTTP request headers, browser user-agent strings, and JSON Web Tokens (JWT) required to authenticate API requests and prevent unauthorized access.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">3.</span> Legal Bases & Purposes of Processing (Art. 6 GDPR)
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
            <li>
              <strong>Performance of a Contract (Art. 6(1)(b) GDPR):</strong> Processing your registration, dispatching welcome and order confirmation emails, generating pickup codes, facilitating surplus food alerts, and routing payments and partner payouts. Users may opt out of surplus food availability email alerts at any time by contacting support or deleting their account.
            </li>
            <li>
              <strong>Legal Obligation (Art. 6(1)(c) GDPR):</strong> Retaining transaction records and payment verification logs required for accounting and regulatory compliance in Luxembourg.
            </li>
            <li>
              <strong>Legitimate Interests (Art. 6(1)(f) GDPR):</strong> Enforcing database Row-Level Security (RLS), verifying JWT bearer tokens on API endpoints, preventing race conditions or duplicate charges, and protecting the platform against fraud.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">4.</span> Data Processors & Third-Party Recipients
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We share data strictly with infrastructure providers necessary to operate LetzSave. We never sell personal data to third parties:
          </p>
          <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <strong className="text-gray-900">1. Supabase Inc. (Database & Authentication):</strong> Hosts our PostgreSQL database and authentication system in European Union (AWS EU) data centers.
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <strong className="text-gray-900">2. Vercel Inc. (Web Hosting & Edge Network):</strong> Hosts the Next.js web application and processes incoming HTTP traffic and IP logs to deliver the site securely.
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <strong className="text-gray-900">3. Stripe Payments Europe, Ltd. (Payments & Payouts):</strong> Processes customer checkouts and Restaurant Partner Express onboarding in Ireland/EU. LetzSave never views or stores raw credit card numbers.
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <strong className="text-gray-900">4. Resend Inc. (Transactional Email API):</strong> Dispatches automated registration welcome emails, order receipts, and instant surplus food notifications.
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <strong className="text-gray-900">5. Google Ireland Limited (OAuth & Maps):</strong> Facilitates optional one-click &quot;Continue with Google&quot; authentication and provides address mapping for restaurant pickup locations.
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">5.</span> International Data Transfers (Chapter V GDPR)
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            While our primary database (Supabase) and payment gateway (Stripe Europe) process data within the European Economic Area (EEA), certain technical sub-processors (such as Vercel Inc. and Resend Inc.) are headquartered in the United States. Where personal data is transferred outside the EEA, protection is ensured via certification under the <strong>EU-U.S. Data Privacy Framework (DPF)</strong> and the European Commission&apos;s <strong>Standard Contractual Clauses (SCCs)</strong> pursuant to Article 46(2)(c) GDPR.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">6.</span> Data Retention Periods
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            User profile data is retained for the duration of your active account or until the conclusion of the LetzSave Mini-Entreprise academic cycle, at which point non-essential personal data is securely purged. Order and financial transaction records are retained only for the duration required to satisfy financial audit requirements of Jonk Entrepreneuren Luxembourg and Luxembourg commercial law.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">7.</span> Your GDPR Rights
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
            <li><strong>Access & Portability (Arts. 15 & 20):</strong> Request a copy of all personal data linked to your account in a structured format.</li>
            <li><strong>Rectification (Art. 16):</strong> Update inaccurate account or restaurant profile details directly via your dashboard or by email request.</li>
            <li><strong>Erasure / Right to be Forgotten (Art. 17):</strong> Request immediate deletion of your account from our Supabase authentication and profile tables.</li>
            <li><strong>Restriction & Objection (Arts. 18 & 21):</strong> Object to specific processing activities, including automated email alerts.</li>
            <li>
              <strong>Supervisory Authority Complaint:</strong> You have the right to lodge a complaint with Luxembourg&apos;s data protection authority: <em>Commission Nationale pour la Protection des Données (CNPD)</em>, 15, Boulevard du Jazz, L-4370 Belvaux (<a href="https://cnpd.public.lu" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">cnpd.public.lu</a>).
            </li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">8.</span> Cookies & Browser Storage
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LetzSave uses strictly necessary first-party authentication tokens (stored via browser `localStorage` and session cookies) to keep you logged in and authorize API requests. Because we do not use analytics, advertising, or third-party tracking cookies, no intrusive cookie tracking banner is required under Article 5(3) of the ePrivacy Directive.
          </p>
        </section>

        {/* Footer Navigation */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 LetzSave Luxembourg. Rescuing food sustainably.</p>
          <div className="flex gap-4">
            <Link href="/" className="text-emerald-600 font-semibold hover:underline">
              ← Back to Listings Feed
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-emerald-600">
              Terms & Conditions
            </Link>
            <Link href="/imprint" className="text-gray-500 hover:text-emerald-600">
              Impressum
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}