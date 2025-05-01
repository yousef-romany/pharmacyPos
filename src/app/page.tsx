
// This page might not even be rendered if middleware redirects correctly.
// Keep it simple or show a basic loading/welcome message if needed.
export default function HomePage() {
  // Middleware should handle the redirection based on auth status.
  // No client-side redirection logic needed here anymore.
  return (
      <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p> {/* Or a welcome message */}
      </div>
  );
}
