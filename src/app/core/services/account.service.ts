import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import { AccountResponse, AccountStatus } from '../models/account.models';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/accounts`;

  getAll(): Observable<ApiResponse<AccountResponse[]>> {
    return this.http.get<ApiResponse<AccountResponse[]>>(this.baseUrl);
  }

  getById(id: number): Observable<ApiResponse<AccountResponse>> {
    return this.http.get<ApiResponse<AccountResponse>>(`${this.baseUrl}/${id}`);
  }

  getByNumber(accountNumber: string): Observable<ApiResponse<AccountResponse>> {
    return this.http.get<ApiResponse<AccountResponse>>(`${this.baseUrl}/number/${accountNumber}`);
  }

  updateStatus(accountId: number, status: AccountStatus): Observable<ApiResponse<AccountResponse>> {
    return this.http.patch<ApiResponse<AccountResponse>>(`${this.baseUrl}/${accountId}/status`, null, {
      params: { status },
    });
  }
}

