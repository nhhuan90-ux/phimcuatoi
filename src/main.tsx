import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './tv.css';
import { TVProvider } from './contexts/TVContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TVProvider>
      <App />
    </TVProvider>
  </StrictMode>,
);

// Register Service Worker
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
        
        // If there's an existing worker waiting, activate it immediately
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Periodically check for updates every 1 hour
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60);

        // Notify and immediately skip waiting when a new SW is installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available; activating immediately.');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  };

  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }

  // Handle redundant controllers after update
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
}
