import { redirect } from 'next/navigation';

// Clerk's default sign-up path. Keep the query string: invitation links carry a __clerk_ticket.
export default function SignUpRedirect({ searchParams }: SearchParamProps) {
  const query = new URLSearchParams(searchParams as Record<string, string>).toString();
  redirect(`/modern-sign-up${query ? `?${query}` : ''}`);
}
