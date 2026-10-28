import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { MainLayoutComponent } from './layout/main-layout';
import { CustomerComponent } from './page/customer/customer';
import { DashboardComponent } from './page/dashboard/dashboard';
import { DashboardAdminComponent } from './page/dashboard_admin/dashboard_admin';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // 1. Trang Đăng nhập (khách chưa đăng nhập mới vào được)
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
  },

  // 2. Toàn bộ các trang nghiệp vụ Backend bọc bởi MainLayout, yêu cầu đăng nhập (authGuard)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'admin',
        pathMatch: 'full',
      },
      {
        path: 'admin',
        component: DashboardAdminComponent,
      },
      {
        path: 'customers',
        component: CustomerComponent,
      },
      {
        path: 'transactions',
        component: DashboardComponent,
      },
    ],
  },

  // 3. Fallback: URL lạ tự chuyển về trang chủ (nếu đăng nhập -> admin, nếu chưa -> login)
  {
    path: '**',
    redirectTo: '',
  },
];
