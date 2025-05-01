import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a fallback, system fonts preferred by globals.css
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Re-add Toaster to root layout to ensure toasts work everywhere

const inter = Inter({ subsets: ['latin'] }); // Keep Inter for potential English text

export const metadata: Metadata = {
  title: 'صيدليتي - My Pharmacy',
  description: 'Pharmacy Management System', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Ensure no extra whitespace between html tag and body tag to prevent hydration errors
    <html lang="ar" dir="rtl"><head />{/* Next.js implicitly handles the <head> tag */}
      <body className={inter.className}>{children}<Toaster /></body>
    </html>
  );
}
