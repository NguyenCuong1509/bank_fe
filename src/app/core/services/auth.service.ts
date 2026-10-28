import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CurrentUser, LoginRequest, LoginResponse } from '../models/auth.models';

const TOKEN_KEY = 'bank_auth_token';
const USER_KEY = 'bank_auth_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Modern Angular Signals for reactive state
  readonly currentUser = signal<CurrentUser | null>(this.getStoredUser());
  readonly isAuthenticated = signal<boolean>(!!this.getStoredToken());

  /**
   * Gọi API đăng nhập tới Spring Boot backend (/api/auth/login)
   */
  login(request: LoginRequest, rememberMe: boolean = true): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/api/auth/login`, request)
      .pipe(
        tap((res) => {
          if (res && res.result && res.result.token) {
            const result = res.result;
            const user: CurrentUser = {
              userId: result.userId,
              username: result.username,
              customerId: result.customerId,
              fullName: result.fullName,
              role: result.role,
            };

            const storage = rememberMe ? localStorage : sessionStorage;
            // Clear other storage to avoid conflict
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(USER_KEY);

            storage.setItem(TOKEN_KEY, result.token);
            storage.setItem(USER_KEY, JSON.stringify(user));

            this.currentUser.set(user);
            this.isAuthenticated.set(true);
          }
        })
      );
  }

  /**
   * Đăng xuất, dọn dẹp storage và quay về trang đăng nhập
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    this.router.navigate(['/login']);
  }

  /**
   * Lấy JWT Token từ storage
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  /**
   * Kiểm tra quyền người dùng
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user ? user.role.toUpperCase() === role.toUpperCase() : false;
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  private getStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}
