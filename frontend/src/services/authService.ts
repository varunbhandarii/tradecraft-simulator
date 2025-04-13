import axios from 'axios';
import apiClient from './apiClient';

interface RegisterData {
  username: string;
  email: string;
  password: string;
}
interface LoginCredentials {
  username: string;
  password: string;
}
interface LoginResponse {
  access_token: string;
  token_type: string;
}
interface UserResponse {
     id: number;
     username: string;
     email: string;
     is_active: boolean;
     created_at: string;
}

export const registerUser = async (userData: RegisterData): Promise<UserResponse> => {
  try {
    const response = await apiClient.post<UserResponse>('/auth/register', userData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Registration failed');
    }
    throw new Error('An unexpected error occurred during registration');
  }
};

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    const response = await apiClient.post<LoginResponse>(
      '/auth/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
       if (error.response.status === 401) {
           throw new Error(error.response.data.detail || 'Incorrect username or password');
       }
      throw new Error(error.response.data.detail || 'Login failed');
    }
    throw new Error('An unexpected error occurred during login');
  }
};

interface UserInfo {
    id: number;
    username: string;
    email: string;
}

export const fetchUserProfile = async (): Promise<UserInfo> => {
    try {
        const response = await apiClient.get<UserInfo>('/users/me');
        return response.data;
    } catch (error) {
         console.error("API call to /users/me failed:", error);
         if (axios.isAxiosError(error) && error.response) {
             throw new Error(error.response.data.detail || 'Failed to fetch user profile');
         }
        throw new Error('An unexpected error occurred fetching user profile');
    }
};