import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a24',
          color: '#e2e8f0',
          border: '1px solid #2a2a3a',
        },
        success: {
          iconTheme: {
            primary: '#16a34a',
            secondary: '#e2e8f0',
          },
        },
        error: {
          iconTheme: {
            primary: '#dc2626',
            secondary: '#e2e8f0',
          },
        },
      }}
    />
  </StrictMode>,
)
