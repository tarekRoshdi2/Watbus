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
        if (admin && admin.password) {
          config = config || {};
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${admin.password}` // using password as a simple auth token for now
          };
        }
      } catch (e) {}
    }
  }
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
