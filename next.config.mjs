import { withPayload } from "@payloadcms/next/withPayload";

const imgproxyPublicURL = new URL(process.env.IMGPROXY_PUBLIC_URL ?? "http://localhost:8080");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      {
        protocol: imgproxyPublicURL.protocol.replace(":", ""),
        hostname: imgproxyPublicURL.hostname,
        port: imgproxyPublicURL.port,
        pathname: "/**",
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
  // The default Payload admin UI at /admin has been removed. Anyone hitting an
  // old /admin bookmark is sent to the new custom Studio admin at /studio.
  async redirects() {
    return [
      { source: "/admin", destination: "/studio", permanent: false },
      { source: "/admin/:path*", destination: "/studio", permanent: false },
    ];
  },
};

export default withPayload(nextConfig);
