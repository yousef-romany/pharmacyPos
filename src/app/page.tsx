"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately to the main dashboard or POS page
    router.replace('/pos'); // Or '/dashboard' if you create a separate dashboard overview page
  }, [router]);

  // Optional: Render a loading state or nothing while redirecting
  return null;
  // Or: return <p>Loading...</p>;
}
