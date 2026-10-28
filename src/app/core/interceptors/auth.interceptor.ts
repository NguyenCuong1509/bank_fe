import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;
  // Gắn header Authorization nếu có token và không phải login/register
  if (token && !req.url.includes('/api/auth/')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Nếu token hết hạn hoặc không có quyền (401), chuyển hướng về trang login
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
