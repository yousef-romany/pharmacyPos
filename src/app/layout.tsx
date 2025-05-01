import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a fallback, system fonts preferred by globals.css
import './globals.css';
// import { Toaster } from "@/components/ui/toaster"; // Removed Toaster from root layout

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
    <html lang="ar" dir="rtl">
      <body className={inter.className}> {/* Use Inter font class */}
        {children}
        {/* <Toaster /> */} {/* Toaster can be added within specific layouts or pages */}
      </body>
    </html>
  );
}
