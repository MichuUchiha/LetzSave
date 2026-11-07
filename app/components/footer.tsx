import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 text-xs text-gray-500 mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 LetzSave Luxembourg. Rescuing food sustainably.</p>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-emerald-600 transition">Terms & Conditions</Link>
          <Link href="/privacy" className="hover:text-emerald-600 transition">Privacy Policy</Link>
          <Link href="/imprint" className="hover:text-emerald-600 transition">Impressum</Link>
        </div>
      </div>
    </footer>
  );
}