import { Buffer } from 'buffer'

if (typeof window !== 'undefined') {
  ;(window as any).Buffer = (window as any).Buffer || Buffer
  ;(window as any).global = (window as any).global || window
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
