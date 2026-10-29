import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { AccountService } from '../../core/services/account.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Customer } from '../../core/models/customer.models';
import { AccountResponse } from '../../core/models/account.models';
import { TransactionResponse } from '../../core/models/transaction.models';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard_admin.html',
})
export class DashboardAdminComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly accountService = inject(AccountService);
  private readonly transactionService = inject(TransactionService);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  customers = signal<Customer[]>([]);
  accounts = signal<AccountResponse[]>([]);
  transactions = signal<TransactionResponse[]>([]);

  // Computed KPIs
  totalSystemBalance = computed(() => {
    return this.accounts().reduce((sum, acc) => sum + (acc.balance || 0), 0);
  });

  formattedSystemBalance = computed(() => {
    const total = this.totalSystemBalance();
    if (total >= 1_000_000_000) {
      return (total / 1_000_000_000).toFixed(2) + ' Tỷ VND';
    } else if (total >= 1_000_000) {
      return (total / 1_000_000).toFixed(2) + ' Triệu VND';
    }
    return total.toLocaleString() + ' VND';
  });

  totalTransactionsCount = computed(() => this.transactions().length);

  successRate = computed(() => {
    const total = this.transactions().length;
    if (total === 0) return '100%';
    const successCount = this.transactions().filter((t) => t.status === 'SUCCESS').length;
    return ((successCount / total) * 100).toFixed(1) + '%';
  });

  activeCustomersCount = computed(
    () => this.customers().filter((c) => c.customerStatus === 'ACTIVE').length
  );

  lockedAccountsCount = computed(
    () => this.accounts().filter((a) => a.accountStatus === 'LOCKED').length
  );

  recentTransactions = computed(() => {
    return this.transactions().slice(0, 6);
  });

  topAccounts = computed(() => {
    return [...this.accounts()]
      .sort((a, b) => (b.balance || 0) - (a.balance || 0))
      .slice(0, 4);
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Tải song song customers, accounts, transactions
    this.customerService.getAll().subscribe({
      next: (res) => this.customers.set(res.result || []),
      error: (err) => console.error('Error fetching customers:', err),
    });

    this.accountService.getAll().subscribe({
      next: (res) => this.accounts.set(res.result || []),
      error: (err) => console.error('Error fetching accounts:', err),
    });

    this.transactionService.getAll().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.transactions.set(res.result || []);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error fetching transactions:', err);
      },
    });
  }
}
