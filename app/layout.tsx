import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from '@/app/components/footer';// Import your global footer component
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'LetzSave | Rescuing Surplus Food in Luxembourg',
  description: 'Save delicious surplus food from local restaurants at a 50% discount.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col justify-between">
        {children}
        <Footer /> {/* Automatically renders on every page */}
      </body>
    </html>
  );
}