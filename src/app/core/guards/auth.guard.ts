import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard: Bảo vệ các route yêu cầu đăng nhập.
 * Nếu chưa đăng nhập, chuyển hướng về /login kèm theo returnUrl.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * GuestGuard: Dành cho trang /login.
 * Nếu đã đăng nhập thì tự động đẩy vào trang quản trị /admin, không cho mở lại form login.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/admin']);
  }

  return true;
};
