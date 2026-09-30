/** @type {import('next').NextConfig} */
const nextConfig = {
  // E2E tests build into their own folder so they don't clobber a running `next dev`
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'cdn1.iconfinder.com' }
    ]
  }
};

export default nextConfig;