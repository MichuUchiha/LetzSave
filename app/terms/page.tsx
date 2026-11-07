import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | LetzSave Luxembourg',
  description: 'Terms and Conditions of Service for the LetzSave surplus food rescue platform.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-gray-900">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-12 shadow-sm space-y-10">
        
        {/* Header */}
        <div className="border-b border-gray-100 pb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-3">
            <span>🌱</span> Legal Framework
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Terms & Conditions of Service
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Last revised: November 2026 | Governing jurisdiction: Grand Duchy of Luxembourg
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">1.</span> Scope & Contractual Role of LetzSave
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LetzSave is a digital marketplace established in Luxembourg aimed at reducing commercial food waste. We enable verified food establishments (&quot;Restaurant Partners&quot;) to list surplus meals and groceries at a minimum mandatory discount of 50% off their standard retail price for self-pickup by consumers (&quot;Customers&quot;).
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong>Intermediary Status (EU Omnibus Directive Disclosure):</strong> LetzSave acts strictly as an intermediary platform provider. When a Customer reserves a food package, the legally binding sales contract for the supply of food is formed directly and exclusively between the Customer and the respective Restaurant Partner. The Restaurant Partner is the sole legal seller (Merchant) of the goods. LetzSave does not prepare, handle, store, or take legal title to any food items.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">2.</span> Account Registration & Security
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
            <li>
              <strong>Eligibility:</strong> Customers must be at least 18 years old or possess legal parental or guardian consent to form binding agreements under Luxembourg law.
            </li>
            <li>
              <strong>Account Confidentiality:</strong> Users are responsible for safeguarding their login credentials (whether via email/password or Google OAuth). Any transaction executed under an authenticated session is the responsibility of the account holder.
            </li>
            <li>
              <strong>Partner Verification:</strong> Restaurant Partner accounts undergo manual verification by LetzSave administrators before gaining permissions to publish listings or initialize Stripe payouts.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">3.</span> Pricing, Payments & Platform Commission
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
            <li>
              <strong>50% Minimum Discount Rule:</strong> All items listed on LetzSave must be priced at a minimum discount of 50% relative to the Restaurant Partner&apos;s standard in-store consumer pricing. All displayed prices are final and inclusive of applicable taxes.
            </li>
            <li>
              <strong>Payment Processing:</strong> Customer payments are processed via Stripe. Reservation confirmation and inventory deduction occur only upon verified payment completion.
            </li>
            <li>
              <strong>Platform Commission (85% / 15% Split):</strong> For each fulfilled order, LetzSave retains a <strong>15% platform service commission</strong> from the gross discounted transaction price to cover infrastructure and payment processing costs. The remaining <strong>85%</strong> is routed directly to the Restaurant Partner&apos;s connected Stripe Express account.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">4.</span> Pickup Windows, Verification & Refund Policy
          </h2>
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3 text-sm text-gray-700">
            <p>
              <strong>1. Collection Commitment:</strong> Every listing specifies an exact pickup date and time window. Customers must arrive at the Restaurant Partner&apos;s premises within this designated window and present their 6-character alphanumeric pickup code.
            </p>
            <p>
              <strong>2. Customer No-Show / Late Arrival:</strong> Because surplus food is highly perishable, orders not collected before the expiration of the pickup window are forfeited. The Restaurant Partner may dispose of or redistribute uncollected food, and <strong>no refund will be issued</strong> for customer no-shows.
            </p>
            <p className="text-emerald-950 font-medium border-t border-emerald-200/60 pt-2">
              <strong>3. Restaurant Partner Default (100% Refund Guarantee):</strong> If a Customer arrives within the designated pickup window and the Restaurant Partner is unexpectedly closed, out of stock of the reserved package, or refuses to honor a valid pickup code, the Customer is entitled to a <strong>full 100% refund</strong>. Customers must report failed pickups to <span className="underline">support@letzsave.lu</span> within 48 hours of the scheduled pickup end time.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">5.</span> Statutory Right of Withdrawal Exception
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Pursuant to Article L. 222-9 (d) of the Luxembourg Consumer Code (implementing EU Directive 2011/83/EU), the statutory 14-day right of withdrawal for distance contracts does not apply to the supply of goods that are liable to deteriorate or expire rapidly (such as prepared restaurant meals and fresh food). Except in cases of Restaurant Partner default under Section 4.3, paid reservations are final and non-cancellable.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">6.</span> Food Safety, Hygiene & Allergens
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
            <li>
              <strong>Partner Liability:</strong> Restaurant Partners are solely and exclusively responsible for ensuring that all food handed over complies with European and Luxembourg food safety regulations (including Regulation (EC) No 852/2004 on the hygiene of foodstuffs and HACCP standards).
            </li>
            <li>
              <strong>Allergens (EU Regulation 1169/2011):</strong> Because surplus packages and surprise bags vary based on daily unsold inventory, ingredient lists cannot always be fixed in advance on the platform. Customers with allergies or dietary intolerances must inquire directly with the Restaurant Partner staff upon pickup before consuming the food.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">7.</span> Limitation of Liability
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            To the fullest extent permitted by Luxembourg law, LetzSave, its student operators, and Jonk Entrepreneuren Luxembourg asbl shall not be held liable for indirect or consequential damages, foodborne illness, allergic reactions, or partner non-performance. Nothing in these terms excludes liability for gross negligence, willful misconduct, or statutory consumer rights that cannot be waived by law.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">8.</span> Governing Law & Jurisdiction
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            These Terms & Conditions are governed by the laws of the Grand Duchy of Luxembourg. Any legal disputes arising out of or in connection with the use of LetzSave shall fall under the jurisdiction of the courts of the District of Luxembourg, without prejudice to mandatory consumer protection provisions of the consumer&apos;s habitual residence.
          </p>
        </section>

        {/* Footer Navigation */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 LetzSave Luxembourg. Student Mini-Entreprise Initiative.</p>
          <div className="flex gap-4">
            <Link href="/" className="text-emerald-600 font-semibold hover:underline">
              ← Back to Listings Feed
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-emerald-600">
              Privacy Policy
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