import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const response = await axiosInstance.get('/auth/me');
          setUser(response.data);
          setToken(savedToken);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const register = async (email, password, fullName) => {
    console.log('🔍 Registration attempt:', { email, fullName });
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);
      params.append('full_name', fullName);

      console.log('📡 Sending registration request to /auth/register');
      const response = await axiosInstance.post('/auth/register', params);
      console.log('✅ Registration response:', response);
      
      // Check if the response indicates success
      if (response.data && response.data.success) {
        return { success: true, data: response.data };
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        return {
          success: false,
          error: response.data?.error || 'Registration failed - unexpected response'
        };
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error response:', error.response);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const login = async (email, password) => {
    console.log('🔍 Login attempt:', { email, password: password.substring(0, 3) + '...' });
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);

      console.log('📡 Sending login request to /auth/login');
      const response = await axiosInstance.post('/auth/login', params);
      console.log('✅ Login response:', response);
      
      if (response.data.success) {
        const { token: newToken, refresh_token, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        // Store refresh token if provided
        if (refresh_token) {
          localStorage.setItem('refreshToken', refresh_token);
          setRefreshToken(refresh_token);
        }
        
        setUser(userData);
        return { success: true };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error response:', error.response);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || 'Login failed'
      };
    }
  };

  // Role-specific login functions
  const loginAdmin = async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);

      const response = await axiosInstance.post('/auth/login/admin', params);
      
      if (response.data.success) {
        const { token: newToken, refresh_token, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        if (refresh_token) {
          localStorage.setItem('refreshToken', refresh_token);
          setRefreshToken(refresh_token);
        }
        
        setUser(userData);
        return { success: true };
      }
      
      return { success: false, error: 'Admin login failed' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || 'Admin login failed'
      };
    }
  };

  const loginManager = async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);

      const response = await axiosInstance.post('/auth/login/manager', params);
      
      if (response.data.success) {
        const { token: newToken, refresh_token, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        if (refresh_token) {
          localStorage.setItem('refreshToken', refresh_token);
          setRefreshToken(refresh_token);
        }
        
        setUser(userData);
        return { success: true };
      }
      
      return { success: false, error: 'Manager login failed' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || 'Manager login failed'
      };
    }
  };

  const loginMember = async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);

      const response = await axiosInstance.post('/auth/login/member', params);
      
      if (response.data.success) {
        const { token: newToken, refresh_token, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        if (refresh_token) {
          localStorage.setItem('refreshToken', refresh_token);
          setRefreshToken(refresh_token);
        }
        
        setUser(userData);
        return { success: true };
      }
      
      return { success: false, error: 'Member login failed' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || 'Member login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginAdmin,
    loginManager,
    loginMember,
    logout,
    register,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
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
