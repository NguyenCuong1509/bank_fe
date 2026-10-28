export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  username: string;
  customerId?: number | null;
  fullName?: string | null;
  authenticated: boolean;
  message?: string;
  role: string;
  token: string;
}

export interface CurrentUser {
  userId: number;
  username: string;
  customerId?: number | null;
  fullName?: string | null;
  role: string;
}
