import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import {
  DepositRequest,
  TransactionResponse,
  TransferRequest,
  WithdrawRequest,
} from '../models/transaction.models';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/transactions`;

  getAll(): Observable<ApiResponse<TransactionResponse[]>> {
    return this.http.get<ApiResponse<TransactionResponse[]>>(this.baseUrl);
  }

  transfer(request: TransferRequest): Observable<ApiResponse<TransactionResponse>> {
    const payload = {
      ...request,
      formAccount: request.fromAccount,
    };
    return this.http.post<ApiResponse<TransactionResponse>>(`${this.baseUrl}/transfer`, payload);
  }

  deposit(request: DepositRequest): Observable<ApiResponse<TransactionResponse>> {
    return this.http.post<ApiResponse<TransactionResponse>>(`${this.baseUrl}/deposit`, request);
  }

  withdraw(request: WithdrawRequest): Observable<ApiResponse<TransactionResponse>> {
    return this.http.post<ApiResponse<TransactionResponse>>(`${this.baseUrl}/withdraw`, request);
  }

  getHistory(accountNumber: string): Observable<ApiResponse<TransactionResponse[]>> {
    return this.http.get<ApiResponse<TransactionResponse[]>>(
      `${this.baseUrl}/history/${accountNumber}`
    );
  }

  getByRef(refNo: string): Observable<ApiResponse<TransactionResponse>> {
    return this.http.get<ApiResponse<TransactionResponse>>(`${this.baseUrl}/${refNo}`);
  }
}

