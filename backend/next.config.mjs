/** @type {import('next').NextConfig} */
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: [
    "sharp",
    "pg",
    "pg-pool",
    "@node-rs/argon2",
    "payload",
    "graphql",
    "@payloadcms/db-postgres",
    "@payloadcms/drizzle",
    "drizzle-kit",
    "drizzle-kit/api",
    "esbuild",
    "esbuild-register",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
