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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
        
        // Periodically check for updates every 1 hour
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60);

        // Notify user if a new SW is waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available; please refresh.');
                // We could prompt the user here, but for now we'll just log
                // or force reload if we are feeling aggressive.
              }
            });
          }
        });
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });

  // Handle redundant controllers after update
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
}
