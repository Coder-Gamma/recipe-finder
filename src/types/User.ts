export interface User {
  id: string;
  name: string;
  email: string;
  gender?: string;
  age?: number;
  address?: string;
  role?: "user" | "admin";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  gender?: string;
  age?: number;
  address?: string;
}

export interface ProfileUpdateRequest {
  name: string;
  email: string;
  gender?: string;
  age?: number;
  address?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
