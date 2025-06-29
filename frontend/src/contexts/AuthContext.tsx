import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface Instructor {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  instructor: Instructor | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.10.118:5000/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);

  // Define logout function first so it can be used in the interceptor
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('instructor');
    
    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    // Update state
    setInstructor(null);
  };

  useEffect(() => {
    // Set up axios response interceptor to handle authentication failures
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // If we get 401 or 403, the token is invalid - auto logout
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Authentication failed - automatically logging out');
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Validate existing token on app start
    const validateStoredToken = async () => {
      const token = localStorage.getItem('token');
      const instructorData = localStorage.getItem('instructor');
      
      if (token && instructorData) {
        try {
          // Set the token temporarily to test it
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Try to fetch courses to validate the token
          await axios.get(`${API_BASE_URL}/courses`);
          
          // If successful, the token is valid
          setInstructor(JSON.parse(instructorData));
        } catch (error: any) {
          console.log('Stored token is invalid, clearing authentication');
          // Token is invalid, clear it
          logout();
        }
      }
      setLoading(false);
    };

    validateStoredToken();

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { token, instructor: instructorData } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('instructor', JSON.stringify(instructorData));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setInstructor(instructorData);
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '로그인에 실패했습니다';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
      });

      const { token, instructor: instructorData } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('instructor', JSON.stringify(instructorData));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setInstructor(instructorData);
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '회원가입에 실패했습니다';
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    instructor,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 