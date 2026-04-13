import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.tsx'
import '@/index.css'
import { registerServiceWorker } from '@/lib/registerSW'

// Register PWA service worker
registerServiceWorker()

// Capture beforeinstallprompt GLOBALLY as early as possible.
// This fires before any React component mounts, so we store it on window
// and DriverGuard reads it from there.
window.__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
  // Dispatch a custom event so any already-mounted component can react
  window.dispatchEvent(new CustomEvent('pwaInstallReady', { detail: e }));
}, { once: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
