'use client';

import { useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/** Google sends people back here; Clerk finishes the sign-in and redirects home. */
export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleRedirectCallback({ redirectUrl: '/sso-callback', afterSignInUrl: '/', afterSignUpUrl: '/' }).catch((err) =>
      setError(err instanceof Error ? err.message : 'Sign-in failed'),
    );
  }, [handleRedirectCallback]);

  return (
    <main className="flex h-screen w-full items-center justify-center bg-dark-100 px-4 text-center">
      {error ? (
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Sign-in didn&apos;t finish</h1>
          <p className="break-words text-gray-400">{error}</p>
          <Link href="/modern-sign-in" className="inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            Back to sign in
          </Link>
        </div>
      ) : (
        <div role="status" className="space-y-6">
          <h1 className="text-2xl font-bold text-white">Signing you in...</h1>
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
    </main>
  );
}
