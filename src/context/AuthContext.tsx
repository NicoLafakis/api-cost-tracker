import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import socketService from '../services/socket';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences?: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; avatarUrl?: string; preferences?: any }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = api.getToken();
    if (token) {
      api.verifyToken()
        .then(data => {
          if (data.valid) {
            setUser(data.user);
            socketService.connect();
          } else {
            api.setToken(null);
          }
        })
        .catch(() => {
          api.setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(data.user);
    socketService.connect();
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await api.register(email, password, name);
    setUser(data.user);
    socketService.connect();
  };

  const logout = () => {
    api.logout();
    setUser(null);
    socketService.disconnect();
  };

  const updateProfile = async (data: { name?: string; avatarUrl?: string; preferences?: any }) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile
    }}>
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
