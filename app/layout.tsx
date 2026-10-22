import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import Provider from './Provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'LiveDocs',
  description: 'Write together in real time: comments, suggestions, version history and sharing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Clerk's sign-in, sign-up and account screens use the same dark theme and blue as the app.
    <ClerkProvider appearance={{ baseTheme: dark, variables: { colorPrimary: '#3371FF', fontSize: '16px' } }}>
      <html lang="en" suppressHydrationWarning>
        <body className={cn('min-h-screen font-sans antialiased', inter.variable)}>
          <Provider>{children}</Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
