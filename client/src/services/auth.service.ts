import axios from 'axios';
import { User } from '@shared/schema';

const API_URL = 'http://localhost:3000/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    uid: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  private setTokens(tokens: { accessToken: string; refreshToken: string }) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private getTokens() {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    };
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/signin`, credentials);
      const { data, tokens } = response.data;
      
      // Store the tokens
      this.setTokens(tokens);
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/signup`, credentials);
      const { data, tokens } = response.data;
      
      // Store the tokens
      this.setTokens(tokens);
      
      return response.data;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  }

  async logout(): Promise<void> {
    try {
      const { accessToken } = this.getTokens();
      if (accessToken) {
        await axios.post(`${API_URL}/auth/logout`, null, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { accessToken } = this.getTokens();
      if (!accessToken) return null;

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      return response.data.data;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { refreshToken } = this.getTokens();
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await axios.post(`${API_URL}/auth/refresh-tokens`, {
        refreshToken
      });

      const { tokens } = response.data;
      this.setTokens(tokens);
      
      return tokens;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const { accessToken } = this.getTokens();
      if (!accessToken) throw new Error('Not authenticated');

      const response = await axios.put(`${API_URL}/auth/me`, profileData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/auth/verify-email`, { token });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  }

  async sendVerificationEmail(): Promise<void> {
    try {
      const { accessToken } = this.getTokens();
      if (!accessToken) throw new Error('Not authenticated');

      await axios.post(`${API_URL}/auth/send-verification-email`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send verification email');
    }
  }
}

export const authService = new AuthService(); 