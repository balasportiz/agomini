// next.config.mjs
// withPayload() is intentionally absent — the frontend no longer imports
// Payload at build time. Payload runs on Railway/Koyeb and is accessed via
// its REST API. Only NEXT_PUBLIC_* vars are available at build time on Vercel.

/** Safely parse a URL, returning null on failure. */
function tryURL(raw) {
  if (!raw) return null;
  try { return new URL(raw); } catch { return null; }
}

const imgproxyPublicURL = tryURL(process.env.IMGPROXY_PUBLIC_URL) ?? tryURL("http://localhost:8080");
const apiURL = tryURL(process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL) ?? tryURL("http://localhost:3000");
const s3PublicURL = tryURL(process.env.S3_PUBLIC_URL);

// Build the list of allowed image origins dynamically so R2 and Railway
// hostnames are allowed without hard-coding them.
function makePattern(url) {
  if (!url) return null;
  return {
    protocol: url.protocol.replace(":", ""),
    hostname: url.hostname,
    port: url.port ?? "",
    pathname: "/**",
  };
}

const remotePatterns = [
  { protocol: "https", hostname: "images.unsplash.com" },
  makePattern(imgproxyPublicURL),
  makePattern(apiURL),
  // Cloudflare R2 public URL (pub-xxxx.r2.dev or custom domain)
  s3PublicURL ? makePattern(s3PublicURL) : null,
  // Allow all *.r2.dev subdomains for R2 public URLs without a custom domain
  { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
].filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["sharp", "pg", "pg-pool", "@node-rs/argon2", "payload"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns,
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
