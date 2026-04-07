import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ReminderProvider } from './context/ReminderContext'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ReminderProvider>
          <Toaster position="top-right" />
          <App />
        </ReminderProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
