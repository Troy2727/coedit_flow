'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AuthForm, { clerkMessage } from '@/components/auth/AuthForm';
import AuthShell from '@/components/auth/AuthShell';

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!isLoaded) return; // Clerk hasn't loaded yet
    setBusy(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/');
      } else {
        setError('Sign-in needs another step this app does not support yet.');
      }
    } catch (err) {
      setError(clerkMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function withGoogle() {
    if (!isLoaded) return;
    try {
      // Clerk sends the user to Google, then back to /sso-callback to finish.
      await signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: '/sso-callback', redirectUrlComplete: '/' });
    } catch (err) {
      setError(clerkMessage(err, 'Could not start Google sign-in. Please try again.'));
    }
  }

  return (
    <AuthShell>
      <AuthForm
        title="Welcome back"
        subtitle="Sign in to your account"
        fields={[
          { label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email', onChange: setEmail },
          { label: 'Password', type: 'password', placeholder: 'Your password', autoComplete: 'current-password', onChange: setPassword },
        ]}
        submitLabel={busy ? 'Signing in...' : 'Sign in →'}
        busy={busy}
        error={error}
        onSubmit={submit}
        google={{ label: 'Continue with Google', onClick: withGoogle }}
        switchPrompt={{ text: "Don't have an account? Sign up", onClick: () => router.push('/modern-sign-up') }}
      />
    </AuthShell>
  );
}
