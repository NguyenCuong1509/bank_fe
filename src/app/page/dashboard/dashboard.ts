import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { AccountService } from '../../core/services/account.service';
import { AccountResponse } from '../../core/models/account.models';
import {
  DepositRequest,
  TransactionResponse,
  TransferRequest,
  WithdrawRequest,
} from '../../core/models/transaction.models';

type TransactionTab = 'transfer' | 'deposit' | 'withdraw';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);

  // Tabs
  activeTab = signal<TransactionTab>('transfer');

  // Loading & Thông báo
  isSubmitting = signal<boolean>(false);
  isLoadingHistory = signal<boolean>(false);
  isLookingUpAccount = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Tra cứu tài khoản
  lookupInput = signal<string>('1000000001');
  lookedUpAccount = signal<AccountResponse | null>(null);
  lookupError = signal<string | null>(null);

  // Lịch sử giao dịch & Bộ lọc
  transactions = signal<TransactionResponse[]>([]);
  accountFilter = signal<string>('');
  selectedTransaction = signal<TransactionResponse | null>(null);

  // Forms
  transferForm: FormGroup = this.fb.group({
    fromAccount: ['', [Validators.required, Validators.minLength(4)]],
    toAccount: ['', [Validators.required, Validators.minLength(4)]],
    amount: [null, [Validators.required, Validators.min(1000)]],
  });

  depositForm: FormGroup = this.fb.group({
    accountNumber: ['', [Validators.required, Validators.minLength(4)]],
    amount: [null, [Validators.required, Validators.min(1000)]],
  });

  withdrawForm: FormGroup = this.fb.group({
    accountNumber: ['', [Validators.required, Validators.minLength(4)]],
    amount: [null, [Validators.required, Validators.min(1000)]],
  });

  ngOnInit(): void {
    this.loadTransactions();
    this.lookupAccount('1000000001');
  }

  setTab(tab: TransactionTab): void {
    this.activeTab.set(tab);
    this.clearAlerts();
  }

  clearAlerts(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // --- TRA CỨU SỐ DƯ TÀI KHOẢN ---

  lookupAccount(queryOverride?: string): void {
    const val = (queryOverride ?? this.lookupInput()).trim();
    if (!val) return;

    this.isLookingUpAccount.set(true);
    this.lookupError.set(null);

    // Thử tìm theo số tài khoản trước
    this.accountService.getByNumber(val).subscribe({
      next: (res) => {
        this.isLookingUpAccount.set(false);
        this.lookedUpAccount.set(res.result);
      },
      error: () => {
        // Nếu không ra theo số TK, thử tìm theo Account ID (nếu là số nguyên)
        const id = Number(val);
        if (!isNaN(id)) {
          this.accountService.getById(id).subscribe({
            next: (res2) => {
              this.isLookingUpAccount.set(false);
              this.lookedUpAccount.set(res2.result);
            },
            error: () => {
              this.isLookingUpAccount.set(false);
              this.lookedUpAccount.set(null);
              this.lookupError.set(`Không tìm thấy tài khoản "${val}"!`);
            },
          });
        } else {
          this.isLookingUpAccount.set(false);
          this.lookedUpAccount.set(null);
          this.lookupError.set(`Không tìm thấy tài khoản "${val}"!`);
        }
      },
    });
  }

  fillAccountIntoForm(accountNumber: string, targetField: 'fromAccount' | 'toAccount' | 'accountNumber'): void {
    if (this.activeTab() === 'transfer') {
      if (targetField === 'fromAccount') {
        this.transferForm.patchValue({ fromAccount: accountNumber });
      } else {
        this.transferForm.patchValue({ toAccount: accountNumber });
      }
    } else if (this.activeTab() === 'deposit') {
      this.depositForm.patchValue({ accountNumber });
    } else if (this.activeTab() === 'withdraw') {
      this.withdrawForm.patchValue({ accountNumber });
    }
  }

  // --- THỰC HIỆN GIAO DỊCH ---

  submitTransfer(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.clearAlerts();
    this.isSubmitting.set(true);
    const { fromAccount, toAccount, amount } = this.transferForm.value;

    const req: TransferRequest = {
      fromAccount: fromAccount.trim(),
      toAccount: toAccount.trim(),
      amount: Number(amount),
    };

    this.transactionService.transfer(req).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        const ref = res.result?.refNo || '';
        this.successMessage.set(
          `Chuyển khoản thành công! Mã giao dịch: ${ref}. Số tiền: ${Number(amount).toLocaleString()} VND.`
        );
        this.transferForm.reset();
        this.loadTransactions();
        if (this.lookedUpAccount()) {
          this.lookupAccount(this.lookedUpAccount()!.accountNumber);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Giao dịch chuyển tiền thất bại!');
      },
    });
  }

  submitDeposit(): void {
    if (this.depositForm.invalid) {
      this.depositForm.markAllAsTouched();
      return;
    }

    this.clearAlerts();
    this.isSubmitting.set(true);
    const { accountNumber, amount } = this.depositForm.value;

    const req: DepositRequest = {
      accountNumber: accountNumber.trim(),
      amount: Number(amount),
    };

    this.transactionService.deposit(req).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        const ref = res.result?.refNo || '';
        this.successMessage.set(
          `Nạp tiền thành công! Mã giao dịch: ${ref}. Số tiền: ${Number(amount).toLocaleString()} VND.`
        );
        this.depositForm.reset();
        this.loadTransactions();
        if (this.lookedUpAccount()) {
          this.lookupAccount(this.lookedUpAccount()!.accountNumber);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Nạp tiền thất bại!');
      },
    });
  }

  submitWithdraw(): void {
    if (this.withdrawForm.invalid) {
      this.withdrawForm.markAllAsTouched();
      return;
    }

    this.clearAlerts();
    this.isSubmitting.set(true);
    const { accountNumber, amount } = this.withdrawForm.value;

    const req: WithdrawRequest = {
      accountNumber: accountNumber.trim(),
      amount: Number(amount),
    };

    this.transactionService.withdraw(req).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        const ref = res.result?.refNo || '';
        this.successMessage.set(
          `Rút tiền thành công! Mã giao dịch: ${ref}. Số tiền: ${Number(amount).toLocaleString()} VND.`
        );
        this.withdrawForm.reset();
        this.loadTransactions();
        if (this.lookedUpAccount()) {
          this.lookupAccount(this.lookedUpAccount()!.accountNumber);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Rút tiền thất bại!');
      },
    });
  }

  // --- LỊCH SỬ GIAO DỊCH ---

  loadTransactions(): void {
    this.isLoadingHistory.set(true);
    const filter = this.accountFilter().trim();

    if (filter) {
      this.transactionService.getHistory(filter).subscribe({
        next: (res) => {
          this.isLoadingHistory.set(false);
          this.transactions.set(res.result || []);
        },
        error: (err) => {
          this.isLoadingHistory.set(false);
          this.transactions.set([]);
          this.errorMessage.set(
            err.error?.message || `Không thể tải lịch sử giao dịch cho tài khoản ${filter}!`
          );
        },
      });
    } else {
      this.transactionService.getAll().subscribe({
        next: (res) => {
          this.isLoadingHistory.set(false);
          this.transactions.set(res.result || []);
        },
        error: (err) => {
          this.isLoadingHistory.set(false);
          this.transactions.set([]);
          this.errorMessage.set(
            err.error?.message || 'Không thể tải danh sách giao dịch!'
          );
        },
      });
    }
  }

  filterByAccount(accountNumber: string): void {
    this.accountFilter.set(accountNumber);
    this.loadTransactions();
  }

  clearAccountFilter(): void {
    this.accountFilter.set('');
    this.loadTransactions();
  }

  openTransactionDetail(txn: TransactionResponse): void {
    this.selectedTransaction.set(txn);
  }

  closeTransactionDetail(): void {
    this.selectedTransaction.set(null);
  }
}
