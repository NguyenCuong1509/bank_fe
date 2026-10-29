export type AccountType = 'PAYMENT' | 'SAVING';
export type AccountStatus = 'ACTIVE' | 'LOCKED';

export interface AccountResponse {
  accountId: number;
  accountNumber: string;
  balance: number;
  accountStatus: AccountStatus;
  accountType: AccountType;
  createAt?: string;
  dailyLimit?: number;
  customerId: number;
}

export interface AccountRequest {
  accountNumber: string;
  accountType: AccountType;
  customerId: number;
  dailyLimit?: number;
  dailyTransferred?: number;
  transferCountToday?: number;
  interestRate?: number;
  termMonths?: number;
  maturityDate?: string;
}

