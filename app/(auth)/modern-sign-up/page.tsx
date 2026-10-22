'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthForm, { type AuthField, clerkMessage } from '@/components/auth/AuthForm';
import AuthShell from '@/components/auth/AuthShell';

/**
 * Sign-up in two steps: details, then the code Clerk emails to confirm the address.
 * People arriving from a document invitation link carry a `__clerk_ticket` that
 * already holds their email, so they skip the email field and the code.
 */
export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState<string | null>(null);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setTicket(new URLSearchParams(window.location.search).get('__clerk_ticket')), []);

  async function finish(sessionId: string | null) {
    await setActive?.({ session: sessionId });
    router.push('/');
  }

  async function run(step: () => Promise<void>, fallback: string) {
    if (!isLoaded) return; // Clerk hasn't loaded yet
    setBusy(true);
    setError('');
    try {
      await step();
    } catch (err) {
      setError(clerkMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  }

  const createAccount = () =>
    run(async () => {
      const result = await signUp!.create(
        ticket ? { strategy: 'ticket', ticket, firstName, lastName, password } : { firstName, lastName, emailAddress: email, password },
      );
      if (result.status === 'complete') return finish(result.createdSessionId);
      if (result.unverifiedFields.includes('email_address')) {
        await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
        setAwaitingCode(true);
        return;
      }
      setError('Something went wrong. Please try again.');
    }, 'Something went wrong. Please try again.');

  const verifyCode = () =>
    run(async () => {
      const result = await signUp!.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') return finish(result.createdSessionId);
      setError('Something went wrong. Please try again.');
    }, "That code didn't work. Please try again.");

  const withGoogle = () =>
    run(
      () => signUp!.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: '/sso-callback', redirectUrlComplete: '/' }),
      'Could not start Google sign-up. Please try again.',
    );

  if (awaitingCode) {
    return (
      <AuthShell>
        <AuthForm
          title="Check your email"
          subtitle={`We sent a code to ${email}. Enter it below to finish signing up.`}
          fields={[{ label: 'Verification code', type: 'text', placeholder: '6-digit code', autoComplete: 'one-time-code', onChange: setCode }]}
          submitLabel={busy ? 'Verifying...' : 'Verify →'}
          busy={busy}
          error={error}
          onSubmit={verifyCode}
        />
      </AuthShell>
    );
  }

  const fields: AuthField[] = [
    { label: 'First Name', type: 'text', placeholder: 'Ada', autoComplete: 'given-name', onChange: setFirstName },
    { label: 'Last Name', type: 'text', placeholder: 'Lovelace', autoComplete: 'family-name', onChange: setLastName },
    ...(ticket
      ? []
      : [{ label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email', onChange: setEmail } as AuthField]),
    { label: 'Password', type: 'password', placeholder: 'Create a password', autoComplete: 'new-password', onChange: setPassword },
  ];

  return (
    <AuthShell>
      <AuthForm
        title="Create your account"
        subtitle={
          ticket
            ? "You've been invited to a document. Create your account to open it."
            : 'Start writing with your team in minutes.'
        }
        fields={fields}
        submitLabel={busy ? 'Signing up...' : 'Sign up →'}
        busy={busy}
        error={error}
        onSubmit={createAccount}
        google={{ label: 'Continue with Google', onClick: withGoogle }}
        switchPrompt={{ text: 'Already have an account? Sign in', onClick: () => router.push('/modern-sign-in') }}
      />
    </AuthShell>
  );
}
