"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processRedirect = async () => {
      try {
        console.log("SSO Callback: Processing redirect");
        setIsProcessing(true);

        await handleRedirectCallback({
          redirectUrl: "/sso-callback",
          afterSignInUrl: "/",
          afterSignUpUrl: "/",
        });

        console.log("SSO Callback: Redirect processed successfully");
        // No need to manually redirect, Clerk will handle it
      } catch (err) {
        console.error("SSO Callback Error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setIsProcessing(false);
      }
    };

    processRedirect();
  }, [handleRedirectCallback]);

  // If there's an error, provide a way to go back to sign-in
  const handleReturnToSignIn = () => {
    router.push("/modern-sign-in");
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-dark-100">
      <div className="text-center max-w-md px-4">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-red-500">Authentication Error</h1>
            <p className="mt-2 text-gray-400 break-words">{error}</p>
            <button
              onClick={handleReturnToSignIn}
              className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Return to Sign In
            </button>
          </>
        ) : (
          <>
            <div className="animate-pulse">
              <h1 className="text-2xl font-bold text-white">Processing authentication...</h1>
              <p className="mt-2 text-gray-400">Please wait while we complete your sign-in.</p>
              <div className="mt-6 flex justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
