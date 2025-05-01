
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately to the main dashboard page
    router.replace('/dashboard/dashboard');
  }, [router]);

  // Optional: Render a loading state or nothing while redirecting
  return null;
  // Or: return <p>Loading...</p>;
}
