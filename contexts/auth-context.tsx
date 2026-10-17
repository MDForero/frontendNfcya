'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse, LoginData } from '@/lib/api/auth';
import * as authApi from '@/lib/api/auth';
import { setAccessToken } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Schedule proactive token refresh (5 minutes before expiration)
  const scheduleRefresh = useCallback((expiresIn: number) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    // Refresh 5 minutes before expiration (expiresIn is in seconds)
    const refreshTime = (expiresIn - 300) * 1000; // Convert to milliseconds

    if (refreshTime > 0) {
      const timer = setTimeout(async () => {
        console.log('[AuthProvider] Proactive token refresh triggered');
        try {
          const response = await authApi.refresh();
          setAccessToken(response.accessToken);
          setUser(response.user);
          scheduleRefresh(response.expiresIn);
        } catch (error) {
          console.error('[AuthProvider] Proactive refresh failed:', error);
          // Let the interceptor handle it on next request
        }
      }, refreshTime);

      setRefreshTimer(timer);
    }
  }, [refreshTimer]);

  // Initialize auth state - try to refresh on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[AuthProvider] Attempting to restore session...');
        const response = await authApi.refresh();
        setAccessToken(response.accessToken);
        setUser(response.user);
        scheduleRefresh(response.expiresIn);
        console.log('[AuthProvider] Session restored successfully');
      } catch (error) {
        console.log('[AuthProvider] No existing session to restore');
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Cleanup timer on unmount
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [scheduleRefresh]);

  const login = async (data: LoginData) => {
    try {
      console.log('[AuthProvider] Logging in...');
      const response = await authApi.login(data);
      setAccessToken(response.accessToken);
      setUser(response.user);
      scheduleRefresh(response.expiresIn);
      console.log('[AuthProvider] Login successful:', response.user);
    } catch (error) {
      console.error('[AuthProvider] Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthProvider] Logging out current session...');
      await authApi.logout();
    } catch (error) {
      console.error('[AuthProvider] Logout error:', error);
    } finally {
      // Always clear local state even if API call fails
      setAccessToken(null);
      setUser(null);
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        setRefreshTimer(null);
      }
      router.push('/login');
    }
  };

  const logoutAll = async () => {
    try {
      console.log('[AuthProvider] Logging out all sessions...');
      await authApi.logoutAll();
    } catch (error) {
      console.error('[AuthProvider] Logout all error:', error);
    } finally {
      // Always clear local state even if API call fails
      setAccessToken(null);
      setUser(null);
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        setRefreshTimer(null);
      }
      router.push('/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    logoutAll,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
