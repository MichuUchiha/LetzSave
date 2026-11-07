import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum / Legal Notice | LetzSave Luxembourg',
  description: 'Legal provider identification (Mentions Légales / Impressum) for LetzSave Luxembourg.',
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-gray-900">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-12 shadow-sm space-y-10">
        
        {/* Header */}
        <div className="border-b border-gray-100 pb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-3">
            <span>⚖️</span> Legal Notice
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Impressum / Mentions Légales
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Provider identification pursuant to Article 5 of the Luxembourg Law of 14 August 2000 on electronic commerce.
          </p>
        </div>

        {/* Operator Identification */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">1.</span> Platform Operator
          </h2>
          <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl text-sm text-gray-700 space-y-1.5 leading-relaxed">
            <p><strong>Project Name:</strong> LetzSave (Student Mini-Entreprise)</p>
            <p><strong>Supervising Organization:</strong> Jonk Entrepreneuren Luxembourg asbl</p>
            <p><strong>Host Institution:</strong> Athénée de Luxembourg</p>
            <p><strong>Operational Address:</strong> 24, Boulevard Pierre Dupong, L-1430 Luxembourg</p>
            <p><strong>Authorized Representatives:</strong> Michal Siedlecki &amp; [Insert Co-Founders&apos; Names]</p>
          </div>
        </section>

        {/* Contact Details */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">2.</span> Contact Information
          </h2>
          <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl text-sm text-gray-700 space-y-1.5 leading-relaxed">
            <p><strong>General Inquiries:</strong> contact@letzsave.lu</p>
            <p><strong>Customer &amp; Partner Support:</strong> support@letzsave.lu</p>
            <p><strong>Telephone:</strong> +352 [Insert Phone Number]</p>
            <p><strong>Web Domain:</strong> https://www.letzsave.lu</p>
          </div>
        </section>

        {/* Regulatory, RCS & Tax Status */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">3.</span> Legal Status &amp; VAT (TVA) Exemption
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LetzSave is an educational student project operating during the 2026–2027 academic year within the <strong>Mini-Entreprises</strong> program administered by <strong>Jonk Entrepreneuren Luxembourg asbl</strong>.
          </p>
          <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl text-sm text-gray-700 space-y-1.5 leading-relaxed">
            <p><strong>Umbrella Association:</strong> Jonk Entrepreneuren Luxembourg asbl</p>
            <p><strong>Registered Office:</strong> 14, Rue Erasme, L-1468 Luxembourg</p>
            <p><strong>RCS Luxembourg Number (JEL asbl):</strong> F6569</p>
            <p>
              <strong>VAT / TVA Status:</strong> Exempt from standard VAT registration under the pedagogical Mini-Entreprise framework and small enterprise exemption regime in the Grand Duchy of Luxembourg.
            </p>
          </div>
        </section>

        {/* Technical Infrastructure */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">4.</span> Hosting &amp; Technical Infrastructure
          </h2>
          <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl text-sm text-gray-700 space-y-1.5 leading-relaxed">
            <p><strong>Web Application Host:</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
            <p><strong>Database Infrastructure:</strong> Supabase Inc. (Hosted in AWS EU-Central region)</p>
            <p><strong>Payment Gateway:</strong> Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Ireland</p>
          </div>
        </section>

        {/* Consumer Mediation */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">5.</span> Consumer Mediation &amp; Dispute Resolution
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            In the event of an unresolved consumer dispute in Luxembourg, consumers may contact the national consumer ombudsman service: <strong>Service National du Médiateur de la Consommation</strong> (Ancien Hôtel de la Monnaie, 6, rue du Palais de Justice, L-1841 Luxembourg —{' '}
            <a 
              href="https://www.mediateurconsommation.lu" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-600 underline font-medium"
            >
              mediateurconsommation.lu
            </a>
            ). LetzSave endeavors to resolve all customer and partner inquiries amicably via direct support but is not legally obligated to participate in formal arbitration proceedings.
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
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-emerald-600">
              Privacy Policy
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}