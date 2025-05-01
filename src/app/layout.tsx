import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a fallback, system fonts preferred by globals.css
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const inter = Inter({ subsets: ['latin'] }); // Keep Inter for potential English text

export const metadata: Metadata = {
  title: 'صيدليتي - My Pharmacy',
  description: 'Pharmacy Point of Sale System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl"> {/* Set language to Arabic and direction to RTL */}
      <body className={inter.className}> {/* Use Inter font class */}
        {children}
        <Toaster /> {/* Add Toaster for notifications */}
      </body>
    </html>
  );
}
