import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import * as Sentry from "@sentry/react";
import posthog from 'posthog-js';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '@fontsource/poppins/latin-800.css';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ReminderProvider } from './context/ReminderContext'
import { GoogleCalendarProvider } from './context/GoogleCalendarContext'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import MuiDesignSystemProvider from './theme/MuiDesignSystemProvider'

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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
      <BrowserRouter>
        <Toaster
          position="top-center"
          containerStyle={{ zIndex: 2147483647 }}
          toastOptions={{ 
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              color: '#0f172a',
              fontWeight: '700',
              padding: '16px 24px',
              borderRadius: '9999px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              fontSize: '14px',
              letterSpacing: '0.025em'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
        <Sentry.ErrorBoundary fallback={({ error }) => <ErrorBoundary error={error} />}>
          <ThemeProvider>
            <MuiDesignSystemProvider>
              <AuthProvider>
                <GoogleCalendarProvider>
                  <ReminderProvider>
                    <App />
                  </ReminderProvider>
                </GoogleCalendarProvider>
              </AuthProvider>
            </MuiDesignSystemProvider>
          </ThemeProvider>
        </Sentry.ErrorBoundary>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
