"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/modern-sign-in");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-dark-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Redirecting...</h1>
        <p className="mt-2 text-gray-400">Please wait while we redirect you to the sign-in page.</p>
      </div>
    </div>
  );
}
