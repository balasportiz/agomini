// next.config.mjs
// withPayload() is intentionally removed — the frontend no longer imports
// Payload at build time. Payload lives entirely on the VPS and is accessed
// via its REST API. The VPS docker-compose stack still uses the old
// withPayload build (see Dockerfile), but the Vercel build does not need it.

const imgproxyPublicURL = new URL(
  process.env.IMGPROXY_PUBLIC_URL ?? "http://localhost:8080",
);

// On Vercel, NEXT_PUBLIC_API_URL points to the VPS so images are served from there.
const apiURL = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Payload-native modules are never imported in the Vercel build, but
  // excluding them here prevents any transitive import from accidentally
  // pulling them into the edge bundle.
  serverExternalPackages: ["sharp", "pg", "pg-pool", "@node-rs/argon2", "payload"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // imgproxy on the VPS
      {
        protocol: imgproxyPublicURL.protocol.replace(":", ""),
        hostname: imgproxyPublicURL.hostname,
        port: imgproxyPublicURL.port,
        pathname: "/**",
      },
      // Direct photo source route on the VPS (fallback when imgproxy not configured)
      {
        protocol: apiURL.protocol.replace(":", ""),
        hostname: apiURL.hostname,
        port: apiURL.port,
        pathname: "/api/photos/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/admin", destination: "/studio", permanent: false },
      { source: "/admin/:path*", destination: "/studio", permanent: false },
    ];
  },
};

export default nextConfig;
