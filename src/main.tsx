if (typeof window !== 'undefined') {
  // Suppress benign WebSocket/HMR errors in the sandboxed preview environment
  const isBenignWebsocketError = (msg: string) => {
    return (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('closed without opened') ||
      msg.includes('failed to connect') ||
      msg.includes('HMR')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const msg = typeof reason === 'string' ? reason : (reason.message || String(reason));
      if (isBenignWebsocketError(msg)) {
        event.preventDefault();
        event.stopPropagation();
        console.warn('Suppressed benign HMR WebSocket rejection:', msg);
      }
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (isBenignWebsocketError(msg) || (event.error && isBenignWebsocketError(event.error.message || ''))) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Suppressed benign HMR WebSocket error:', msg);
    }
  });
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

