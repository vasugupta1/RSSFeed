import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initTelemetry } from './telemetry'
import RssFeedWebApp from './RssFeedWebApp.tsx'

// Initialize OpenTelemetry tracing before the app renders
// so the initial fetch() calls are instrumented.
initTelemetry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RssFeedWebApp />
  </StrictMode>,
)
