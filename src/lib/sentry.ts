import * as Sentry from '@sentry/react'

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

let initialized = false

export function initSentry() {
  if (initialized || !DSN) return
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
  })
  initialized = true
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  if (DSN) {
    Sentry.captureException(error, { extra: context })
  }
}
