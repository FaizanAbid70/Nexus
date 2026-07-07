import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import toast from 'react-hot-toast';
import {
  registerRequest,
  loginRequest,
  getMyProfileRequest,
  updateMyProfileRequest,
  clearAuthTokens,
} from '../api/auth';
import { ACCESS_TOKEN_KEY } from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On page load, if we have a stored access token, fetch the real profile
  // to restore the session (instead of trusting a locally cached copy).
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await getMyProfileRequest();
        setUser(profile);
      } catch {
        clearAuthTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Note: `role` is kept in the function signature so LoginPage doesn't need
  // to change, but the backend determines the real role from the account itself.
  const login = async (email: string, password: string, _role: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginRequest(email, password);
      setUser(loggedInUser);
      toast.success('Successfully logged in!');
      return loggedInUser;
    } catch (error: any) {
      const message = error?.response?.data?.non_field_errors?.[0]
        || error?.response?.data?.detail
        || 'Invalid credentials or user not found';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const newUser = await registerRequest(name, email, password, role);
      setUser(newUser);
      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error?.response?.data?.email?.[0]
        || error?.response?.data?.detail
        || 'Could not create account';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot/reset password aren't part of the backend yet (not in the task spec) —
  // kept as lightweight placeholders so the existing pages don't break.
  const forgotPassword = async (_email: string): Promise<void> => {
    toast('Password reset isn\'t wired up to the backend yet.');
  };

  const resetPassword = async (_token: string, _newPassword: string): Promise<void> => {
    toast('Password reset isn\'t wired up to the backend yet.');
  };

  const logout = (): void => {
    clearAuthTokens();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (_userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const updated = await updateMyProfileRequest({
        name: updates.name,
        bio: updates.bio,
      });
      setUser(updated);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Could not update profile';
      toast.error(message);
      throw new Error(message);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
