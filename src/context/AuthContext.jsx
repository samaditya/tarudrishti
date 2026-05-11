import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tarudrishti_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only return if token exists to prevent 401s from mock state
        if (parsed.token) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('tarudrishti_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tarudrishti_user');
    }
  }, [user]);

  const login = (userData) => {
    localStorage.setItem('tarudrishti_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('tarudrishti_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token: user?.token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
