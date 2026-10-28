import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { MainLayoutComponent } from './layout/main-layout';
import { CustomerComponent } from './page/customer/customer';
import { DashboardComponent } from './page/dashboard/dashboard';
import { DashboardAdminComponent } from './page/dashboard_admin/dashboard_admin';

export const routes: Routes = [
  // 1. Trang Đăng nhập (đứng độc lập, không cần Header/Footer)
  {
    path: 'login',
    component: Login,
  },

  // 2. Toàn bộ các trang nghiệp vụ Backend bọc bởi MainLayout (có Header + Footer)
  {
    path: '',
    component: MainLayoutComponent,
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

  // 3. Fallback: URL lạ tự chuyển về trang chủ
  {
    path: '**',
    redirectTo: '',
  },
];
