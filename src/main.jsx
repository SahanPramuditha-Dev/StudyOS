import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import * as Sentry from "@sentry/react";
import posthog from 'posthog-js';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ReminderProvider } from './context/ReminderContext'
import { GoogleCalendarProvider } from './context/GoogleCalendarContext'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'

// 1. Initialize Sentry (Error Monitoring)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, 
    // Session Replay
    replaysSessionSampleRate: 0.1, 
    replaysOnErrorSampleRate: 1.0, 
    environment: import.meta.env.MODE,
  });
}

// 2. Initialize PostHog (Product Analytics)
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false // Manual capture in AuthContext/App
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          containerStyle={{ zIndex: 2147483647 }}
          toastOptions={{ duration: 5000 }}
        />
        <Sentry.ErrorBoundary fallback={({ error }) => <ErrorBoundary error={error} />}>
          <ThemeProvider>
            <AuthProvider>
              <GoogleCalendarProvider>
                <ReminderProvider>
                  <App />
                </ReminderProvider>
              </GoogleCalendarProvider>
            </AuthProvider>
          </ThemeProvider>
        </Sentry.ErrorBoundary>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
