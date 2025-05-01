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
    <html lang="ar" dir="rtl">
      <body className={inter.className}> {/* Use Inter font class */}
        {children}
         <Toaster /> {/* Place Toaster inside body */}
      </body>
    </html>
  );
}
