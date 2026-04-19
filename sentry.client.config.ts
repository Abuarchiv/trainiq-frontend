import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Session Replay (optional)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,

  environment: process.env.NODE_ENV,
  debug: false,
});
