/** Safely parse a URL, returning null on failure. */
function tryURL(raw) {
  if (!raw) return null;
  try { return new URL(raw); } catch { return null; }
}

const imgproxyPublicURL = tryURL(process.env.IMGPROXY_PUBLIC_URL) ?? tryURL("http://localhost:8080");
const apiURL = tryURL(process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL) ?? tryURL("http://localhost:3000");

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
  { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
].filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
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
