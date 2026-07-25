import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept all fetch requests to add Authorization header
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    const adminStr = localStorage.getItem('whatsapp_user');
    if (adminStr) {
      try {
        const admin = JSON.parse(adminStr);
        config = config || {};
        if (admin && admin.token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${admin.token}`
          };
        } else if (admin && admin.password) {
          // Fallback for old sessions without JWT
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${admin.password}`
          };
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  }
  return originalFetch(resource, config);
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
