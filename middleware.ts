import { authMiddleware } from '@clerk/nextjs/server';

// Everything needs a signed-in user except these. Pages that require one also
// redirect to /modern-sign-in themselves.
export default authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/modern-sign-in(.*)',
    '/modern-sign-up(.*)',
    '/sso-callback(.*)',
    '/api/liveblocks-auth',
  ],
});

export const config = {
  // Skip static files and Next internals.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
