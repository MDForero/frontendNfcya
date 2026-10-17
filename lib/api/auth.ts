import apiClient from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENTE' | 'EMPRESA' | 'SOPORTE' | 'SUPER_ADMIN';
  status: 'ACTIVA' | 'SUSPENDIDA';
  emailVerifiedAt: string | null;
  organizationId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

// Register a new user
export const register = async (data: RegisterData): Promise<void> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

// Verify email with token
export const verifyEmail = async (token: string): Promise<void> => {
  const response = await apiClient.post('/auth/verify-email', { token });
  return response.data;
};

// Resend verification email
export const resendVerification = async (email: string): Promise<void> => {
  const response = await apiClient.post('/auth/resend-verification', { email });
  return response.data;
};

// Login
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

// Refresh access token
export const refresh = async (): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/refresh');
  return response.data;
};

// Logout current session
export const logout = async (): Promise<void> => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

// Logout all sessions
export const logoutAll = async (): Promise<void> => {
  const response = await apiClient.post('/auth/logout-all');
  return response.data;
};

// Request password reset
export const forgotPassword = async (email: string): Promise<void> => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

// Reset password with token
export const resetPassword = async (data: ResetPasswordData): Promise<void> => {
  const response = await apiClient.post('/auth/reset-password', data);
  return response.data;
};

// Change password while authenticated
export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  const response = await apiClient.post('/auth/change-password', data);
  return response.data;
};
