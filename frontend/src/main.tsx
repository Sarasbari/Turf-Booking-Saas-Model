import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { App } from './App'
import { ErrorPage } from './pages/ErrorPage'
import './index.css'
import { inject } from '@vercel/analytics'

// ── Sentry (production-only error monitoring) ────────────────────────────
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,            // 'development' | 'production'
  enabled: import.meta.env.PROD,                // only send in production builds
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.2,            // 20% of page loads traced
  replaysSessionSampleRate: 0.1,    // 10% of sessions recorded
  replaysOnErrorSampleRate: 1.0,    // 100% recorded when error occurs
})

// ── Vercel Analytics ─────────────────────────────────────────────────────
inject()

// ── Render App ───────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack, eventId, resetError }) => (
        <ErrorPage
          error={error instanceof Error ? error : new Error(String(error))}
          componentStack={componentStack}
          eventId={eventId}
          resetError={resetError}
        />
      )}
      showDialog
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)