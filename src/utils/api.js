import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Wrapper around standard fetch that automatically attaches the JWT token
 * from localStorage and handles authentication logic.
 */
export async function apiFetch(endpoint, options = {}) {
  const userStr = localStorage.getItem('tarudrishti_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.token;

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure JSON content type if body is present and not form data
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let coldStartToast;
  const coldStartTimeout = setTimeout(() => {
    coldStartToast = toast.loading('Waking up secure server... this may take up to 30s.', {
      id: 'cold-start-toast',
    });
  }, 3000);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    clearTimeout(coldStartTimeout);
    if (coldStartToast) toast.dismiss(coldStartToast);

    if (response.status === 401) {
      // Token is likely expired or invalid. Force a logout.
      localStorage.removeItem('tarudrishti_user');
      window.location.reload();
    }

    return response;
  } catch (error) {
    clearTimeout(coldStartTimeout);
    if (coldStartToast) toast.dismiss(coldStartToast);
    console.error("Network Error:", error);
    // Throw a specific error that the UI can catch and display
    throw new Error("Unable to connect. The server might be unreachable.");
  }
}
