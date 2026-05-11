import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';
import OnlineStatusProvider from './components/OnlineStatusProvider';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <OnlineStatusProvider>
              <App />
            </OnlineStatusProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '16px',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--separator)',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                },
                success: { iconTheme: { primary: '#34C759', secondary: '#fff' } },
                error: { iconTheme: { primary: '#FF453A', secondary: '#fff' } },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
