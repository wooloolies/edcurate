import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

import createNextIntlPlugin from "next-intl/plugin";
import { env } from "./src/config/env";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const isDev = env.NEXT_PUBLIC_ENABLE_DEVTOOLS === "true";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  devIndicators: isDev ? undefined : false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
  logging: isDev
    ? {
        fetches: {
          fullUrl: true,
        },
      }
    : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    typedEnv: true,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSerwist(withNextIntl(nextConfig));
