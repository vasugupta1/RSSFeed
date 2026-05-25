import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RssFeedWebApp from './RssFeedWebApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RssFeedWebApp />
  </StrictMode>,
)
