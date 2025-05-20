import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/modern-sign-in(.*)",
    "/modern-sign-up(.*)",
    "/sso-callback(.*)",
    "/api/auth/(.*)",
    "/api/liveblocks-auth"
  ],
  debug: true,
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};