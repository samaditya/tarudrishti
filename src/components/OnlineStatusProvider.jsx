import { useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Global component that listens for online/offline events
 * and provides instant visual feedback to the user via toasts.
 */
export default function OnlineStatusProvider({ children }) {
  useEffect(() => {
    const handleOnline = () => {
      toast.success('You are back online!', {
        id: 'offline-toast', // Overwrite the offline toast
        icon: '🌐',
        duration: 3000
      });
    };

    const handleOffline = () => {
      toast.error('No internet connection. App is in offline mode.', {
        id: 'offline-toast', // Stable ID to prevent duplicates
        duration: Infinity,
        icon: '📡',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return children;
}
