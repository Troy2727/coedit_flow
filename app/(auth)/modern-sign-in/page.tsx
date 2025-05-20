"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { AnimatedForm, Ripple } from "@/components/modern-animated-sign-in";
import Image from "next/image";



const ModernSignInPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      } else {
        console.error("Sign in failed", result);
        setErrorMessage("Something went wrong. Please try again.");
      }
    } catch (err: any) {
      console.error("Error during sign in:", err);
      setErrorMessage(err.errors?.[0]?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goToSignUp = () => {
    router.push("/modern-sign-up");
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      // Check if user is already signed in
      const activeSession = await clerk.session;
      if (activeSession) {
        console.log("User is already signed in, redirecting to home page");
        router.push("/");
        return;
      }

      // Use relative URLs for Clerk redirects
      const redirectUrl = "/sso-callback";
      const redirectUrlComplete = "/";

      console.log("Starting Google sign-in with:", { redirectUrl, redirectUrlComplete });

      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl,
        redirectUrlComplete
      });
    } catch (err) {
      console.error("Error during Google sign-in:", err);
      if (err instanceof Error && err.message.includes("already signed in")) {
        console.log("User is already signed in, redirecting to home page");
        router.push("/");
      } else if (err instanceof Error) {
        setErrorMessage(`Google sign-in error: ${err.message}`);
      } else {
        setErrorMessage("Failed to initiate Google sign-in. Please try again.");
      }
    }
  };

  // Check if user is already signed in and show sign-out button
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const checkSession = async () => {
        const session = await clerk.session;
        setIsSignedIn(!!session);
      };
      checkSession();
    }
  }, [isLoaded, clerk]);

  const handleSignOut = async () => {
    try {
      await clerk.signOut();
      setIsSignedIn(false);
      window.location.reload(); // Reload the page after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Sign Out Button (only shown when signed in) */}
      {isSignedIn && (
        <button
          onClick={handleSignOut}
          className="absolute right-4 top-4 z-50 rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
        >
          Sign Out
        </button>
      )}

      {/* Left Side - Welcome Sign */}
      <div className="relative h-[40dvh] md:h-[50dvh] lg:h-[100dvh] w-full lg:w-1/2 overflow-hidden circuit-background">
        {/* Circuit nodes and lines */}
        <div className="circuit-node circuit-node-1"></div>
        <div className="circuit-node circuit-node-2"></div>
        <div className="circuit-node circuit-node-3"></div>
        <div className="circuit-node circuit-node-4"></div>
        <div className="circuit-node circuit-node-5"></div>

        <div className="circuit-line circuit-line-1"></div>
        <div className="circuit-line circuit-line-2"></div>
        <div className="circuit-line circuit-line-3"></div>

        <div className="circuit-line-vertical circuit-line-v1"></div>
        <div className="circuit-line-vertical circuit-line-v2"></div>

        <Ripple mainCircleSize={100} mainCircleOpacity={0.15} numCircles={6} className="md:hidden" />
        <Ripple mainCircleSize={150} mainCircleOpacity={0.15} numCircles={9} className="hidden md:flex" />

        {/* Simple Welcome Text */}
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
            <Image
              src="/assets/icons/livedocs-icon.svg"
              alt="LiveDocs Icon"
              width={48}
              height={48}
              className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 drop-shadow-[0_0_15px_rgba(0,150,255,0.5)]"
            />
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white text-center drop-shadow-[0_0_15px_rgba(0,150,255,0.5)]">
              LiveDocs
            </h1>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex w-full flex-col justify-center bg-[#0a1528] py-8 lg:py-0 lg:w-1/2">
        <AnimatedForm
          header="Welcome back"
          subHeader="Sign in to your account"
          fields={[
            {
              label: "Email",
              required: true,
              type: "email",
              placeholder: "Enter your email",
              onChange: (e) => setEmail(e.target.value),
            },
            {
              label: "Password",
              required: true,
              type: "password",
              placeholder: "Enter your password",
              onChange: (e) => setPassword(e.target.value),
            },
          ]}
          submitButton={isLoading ? "Signing in..." : "Sign in →"}
          textVariantButton="Don't have an account? Sign up"
          errorField={errorMessage}
          onSubmit={handleSubmit}
          goTo={goToSignUp}
          googleLogin="Login with Google"
          onGoogleSignIn={handleGoogleSignIn}
          forgotPassword={true}
        />
      </div>
    </div>
  );
};

export default ModernSignInPage;
