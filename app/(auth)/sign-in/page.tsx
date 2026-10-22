import { redirect } from 'next/navigation';

// Clerk's default sign-in path; the app's own page lives at /modern-sign-in.
export default function SignInRedirect({ searchParams }: SearchParamProps) {
  const query = new URLSearchParams(searchParams as Record<string, string>).toString();
  redirect(`/modern-sign-in${query ? `?${query}` : ''}`);
}
