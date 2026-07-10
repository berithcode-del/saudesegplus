import type { Role } from '../enums/index.js';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token?: string;
  user: {
    id: string;
    email: string;
    role: Role;
    profileId?: string | null;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthSession {
  token: string;
  role: Role;
  profileId: string | null;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  profileId?: string | null;
  iat?: number;
  exp?: number;
}

export type { LoginRequest as LoginDto, ChangePasswordRequest as ChangePasswordDto };
