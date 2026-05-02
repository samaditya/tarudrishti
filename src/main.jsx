import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
