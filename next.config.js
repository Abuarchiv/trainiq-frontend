const { withSentryConfig } = require("@sentry/nextjs");
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  importScripts: ["/custom-sw.js"],
  runtimeCaching: [
    {
      urlPattern: /^\/api\/training\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "training-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
        cacheableResponse: { statuses: [0, 200] },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /^\/api\/coach\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "coach-cache",
        expiration: { maxEntries: 30, maxAgeSeconds: 86400 },
        cacheableResponse: { statuses: [0, 200] },
        networkTimeoutSeconds: 8,
      },
    },
    {
      urlPattern: /^\/api\/user\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "user-cache",
        expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
        cacheableResponse: { statuses: [0, 200] },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /^\/api\/metrics\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "metrics-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
        cacheableResponse: { statuses: [0, 200] },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 31536000 },
      },
    },
    {
      urlPattern: /\/(icon\.svg|manifest\.json)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-resources",
        expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // Aggressive caching for static assets (Next already does _next/static)
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" }],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://backend:8000"}/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // @opentelemetry/api → Next.js-bundled Version, verhindert API-Versionskonflikte im RSC-Bundle
    if (isServer) {
      config.resolve.alias["@opentelemetry/api"] = require.resolve(
        "next/dist/compiled/@opentelemetry/api"
      );
    }
    return config;
  },
};

const hasSentry = !!(process.env.SENTRY_AUTH_TOKEN || process.env.NEXT_PUBLIC_SENTRY_DSN);

module.exports = hasSentry
  ? withSentryConfig(withPWA(nextConfig), {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : withPWA(nextConfig);
