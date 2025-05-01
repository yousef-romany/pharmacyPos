
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { useAuthStore } from '@/store/auth-store'; // Import the store

// Define paths that require authentication
const protectedRoutes = ['/dashboard', '/pos', '/products', '/purchases', '/suppliers', '/customers', '/sales', '/inventory', '/reports', '/settings', '/users', '/treasury'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Attempt to get authentication state (this might be tricky in middleware)
  // Zustand state is typically client-side. Middleware runs server-side or edge.
  // A common approach is to use cookies or session tokens managed server-side.

  // --- SIMULATION using a placeholder cookie (Replace with real auth token check) ---
  const isAuthenticated = request.cookies.get('auth-token')?.value === 'dummy-token'; // Replace 'auth-token' and 'dummy-token'

  // Check if the current path starts with any of the protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If trying to access a protected route without being authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Optionally add a 'redirectedFrom' query parameter
    // loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access the login page while already authenticated, redirect to dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard/dashboard', request.url));
  }

  // If accessing the root path, redirect to login or dashboard based on auth status
  if (pathname === '/') {
       return NextResponse.redirect(new URL(isAuthenticated ? '/dashboard/dashboard' : '/login', request.url));
  }


  // Allow the request to proceed if none of the above conditions are met
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/', // Explicitly include the root path
  ],
};
