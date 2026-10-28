import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    rememberMe: [true],
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal<boolean>(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  fillAccount(username: string, pass: string): void {
    this.loginForm.patchValue({
      username,
      password: pass,
    });
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { username, password, rememberMe } = this.loginForm.value;

    this.authService.login({ username, password }, !!rememberMe).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.error?.message) {
          this.errorMessage.set(err.error.message);
        } else if (err.status === 401 || err.status === 400) {
          this.errorMessage.set('Tài khoản hoặc mật khẩu không chính xác!');
        } else if (err.status === 0) {
          this.errorMessage.set('Không thể kết nối tới máy chủ Backend (Port 8080). Vui lòng kiểm tra lại Spring Boot!');
        } else {
          this.errorMessage.set('Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại!');
        }
      },
    });
  }
}
