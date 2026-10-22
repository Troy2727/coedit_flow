'use client';

import { useEffect } from 'react';

/** Last-resort error page for crashes in the root layout. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error('Application error:', error), [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#09111f] px-4 text-center text-white">
        <div className="space-y-4">
          {/* The e2e tests treat this exact text as "the page crashed". */}
          <h1 className="text-2xl font-bold">Application error</h1>
          <p className="text-blue-100/70">The page hit an unexpected error. Your document is saved.</p>
          <button type="button" onClick={reset} className="rounded-md bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
