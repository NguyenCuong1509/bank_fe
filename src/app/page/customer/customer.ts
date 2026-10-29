import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { AccountService } from '../../core/services/account.service';
import { Customer, CustomerRequest } from '../../core/models/customer.models';
import { AccountRequest, AccountResponse, AccountStatus, AccountType } from '../../core/models/account.models';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer.html',
})
export class CustomerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly accountService = inject(AccountService);

  // Danh sách & trạng thái tải
  customers = signal<Customer[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Bộ lọc & tìm kiếm
  searchQuery = signal<string>('');
  selectedStatusFilter = signal<string>('');

  // Modals state
  isCustomerModalOpen = signal<boolean>(false);
  isEditingCustomer = signal<boolean>(false);
  currentCustomerId = signal<number | null>(null);

  isAccountModalOpen = signal<boolean>(false);
  isAccountsListModalOpen = signal<boolean>(false);
  selectedCustomer = signal<Customer | null>(null);
  customerAccounts = signal<AccountResponse[]>([]);
  isLoadingAccounts = signal<boolean>(false);

  // Forms
  customerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{9,11}$/)]],
    dateOfBirth: [''],
    address: [''],
  });

  accountForm: FormGroup = this.fb.group({
    customerId: [null, [Validators.required]],
    accountNumber: ['', [Validators.required, Validators.minLength(6)]],
    accountType: ['PAYMENT', [Validators.required]],
    dailyLimit: [50000000, [Validators.min(0)]],
    interestRate: [5.5],
    termMonths: [12],
    maturityDate: [''],
  });

  // Computed properties
  filteredCustomers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatusFilter();

    return this.customers().filter((c) => {
      const matchName = c.fullName?.toLowerCase().includes(query) ?? false;
      const matchPhone = c.phoneNumber?.toLowerCase().includes(query) ?? false;
      const matchQuery = !query || matchName || matchPhone;

      const matchStatus = !status || c.customerStatus === status;

      return matchQuery && matchStatus;
    });
  });

  totalCustomers = computed(() => this.customers().length);
  activeCustomersCount = computed(
    () => this.customers().filter((c) => c.customerStatus === 'ACTIVE').length
  );
  lockedCustomersCount = computed(
    () => this.customers().filter((c) => c.customerStatus === 'LOCKED').length
  );

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.customerService.getAll().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.customers.set(res.result || []);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Không thể tải danh sách khách hàng. Vui lòng kiểm tra backend!'
        );
      },
    });
  }

  clearAlerts(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // --- QUẢN LÝ KHÁCH HÀNG (ADD / EDIT / TOGGLE STATUS) ---

  openAddCustomerModal(): void {
    this.clearAlerts();
    this.isEditingCustomer.set(false);
    this.currentCustomerId.set(null);
    this.customerForm.reset();
    this.isCustomerModalOpen.set(true);
  }

  openEditCustomerModal(customer: Customer): void {
    this.clearAlerts();
    this.isEditingCustomer.set(true);
    this.currentCustomerId.set(customer.customerId);
    this.customerForm.patchValue({
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      dateOfBirth: customer.dateOfBirth || '',
      address: customer.address || '',
    });
    this.isCustomerModalOpen.set(true);
  }

  closeCustomerModal(): void {
    this.isCustomerModalOpen.set(false);
    this.customerForm.reset();
  }

  saveCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.clearAlerts();
    const data: CustomerRequest = this.customerForm.value;

    if (this.isEditingCustomer() && this.currentCustomerId()) {
      this.customerService.update(this.currentCustomerId()!, data).subscribe({
        next: () => {
          this.successMessage.set('Cập nhật thông tin khách hàng thành công!');
          this.closeCustomerModal();
          this.loadCustomers();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Lỗi khi cập nhật khách hàng!');
        },
      });
    } else {
      this.customerService.create(data).subscribe({
        next: () => {
          this.successMessage.set('Thêm mới khách hàng thành công!');
          this.closeCustomerModal();
          this.loadCustomers();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Lỗi khi thêm mới khách hàng!');
        },
      });
    }
  }

  toggleCustomerStatus(customer: Customer): void {
    this.clearAlerts();
    const newStatus: AccountStatus = customer.customerStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const actionName = newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa';

    if (!confirm(`Bạn có chắc muốn ${actionName} khách hàng "${customer.fullName}"?`)) {
      return;
    }

    this.customerService.updateStatus(customer.customerId, newStatus).subscribe({
      next: () => {
        this.successMessage.set(`Đã ${actionName} khách hàng thành công!`);
        this.loadCustomers();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || `Lỗi khi ${actionName} khách hàng!`);
      },
    });
  }

  // --- MỞ TÀI KHOẢN NGÂN HÀNG ---

  openCreateAccountModal(customer?: Customer): void {
    this.clearAlerts();
    this.accountForm.reset({
      customerId: customer ? customer.customerId : this.customers()[0]?.customerId || null,
      accountNumber: this.generateRandomAccountNumber(),
      accountType: 'PAYMENT',
      dailyLimit: 50000000,
      interestRate: 5.5,
      termMonths: 12,
      maturityDate: '',
    });
    this.selectedCustomer.set(customer || null);
    this.isAccountModalOpen.set(true);
  }

  generateRandomAccountNumber(): string {
    const prefix = '100';
    const random = Math.floor(1000000 + Math.random() * 9000000).toString();
    return `${prefix}${random}`;
  }

  regenerateAccountNumber(): void {
    this.accountForm.patchValue({
      accountNumber: this.generateRandomAccountNumber(),
    });
  }

  closeAccountModal(): void {
    this.isAccountModalOpen.set(false);
  }

  saveAccount(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.clearAlerts();
    const formVal = this.accountForm.value;
    const request: AccountRequest = {
      customerId: Number(formVal.customerId),
      accountNumber: formVal.accountNumber,
      accountType: formVal.accountType as AccountType,
      dailyLimit: formVal.dailyLimit ? Number(formVal.dailyLimit) : 50000000,
      dailyTransferred: 0,
      transferCountToday: 0,
    };

    if (formVal.accountType === 'SAVING') {
      request.interestRate = formVal.interestRate ? Number(formVal.interestRate) : 5.5;
      request.termMonths = formVal.termMonths ? Number(formVal.termMonths) : 12;
      request.maturityDate = formVal.maturityDate || undefined;
    }

    this.customerService.createAccount(request).subscribe({
      next: () => {
        this.successMessage.set(`Mở tài khoản "${formVal.accountNumber}" thành công!`);
        this.closeAccountModal();
        this.loadCustomers();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Lỗi khi mở tài khoản ngân hàng!');
      },
    });
  }

  // --- XEM DANH SÁCH TÀI KHOẢN CỦA KHÁCH HÀNG ---

  viewCustomerAccounts(customer: Customer): void {
    this.clearAlerts();
    this.selectedCustomer.set(customer);
    this.isLoadingAccounts.set(true);
    this.isAccountsListModalOpen.set(true);

    this.customerService.getCustomerAccounts(customer.customerId).subscribe({
      next: (res) => {
        this.isLoadingAccounts.set(false);
        this.customerAccounts.set(res.result || []);
      },
      error: (err) => {
        this.isLoadingAccounts.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể lấy danh sách tài khoản!');
      },
    });
  }

  closeAccountsListModal(): void {
    this.isAccountsListModalOpen.set(false);
    this.customerAccounts.set([]);
  }

  toggleAccountStatus(account: AccountResponse): void {
    const newStatus: AccountStatus = account.accountStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const actionName = newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa';

    if (!confirm(`Bạn có chắc muốn ${actionName} tài khoản "${account.accountNumber}"?`)) {
      return;
    }

    this.accountService.updateStatus(account.accountId, newStatus).subscribe({
      next: () => {
        this.successMessage.set(`Đã ${actionName} tài khoản "${account.accountNumber}" thành công!`);
        if (this.selectedCustomer()) {
          this.viewCustomerAccounts(this.selectedCustomer()!);
        }
        this.loadCustomers();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || `Lỗi khi ${actionName} tài khoản!`);
      },
    });
  }
}
