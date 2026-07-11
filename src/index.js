import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App/>
    </LanguageProvider>
  </React.StrictMode>
);

// Register service worker for PWA installability + offline app shell.
// Uses PUBLIC_URL so it works under the GitHub Pages subpath.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .catch((err) => console.warn('Service worker registration failed:', err));
  });
}
