import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import SyncProvider from "@/components/SyncProvider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'صيدليتي - My Pharmacy',
  description: 'Pharmacy Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl"><head />
      <body className={inter.className}>
        <SyncProvider>
          {children}
        </SyncProvider>
        <Toaster />
      </body>
    </html>
  );
}
