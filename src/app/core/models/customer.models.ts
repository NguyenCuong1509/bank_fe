import { AccountResponse, AccountStatus } from './account.models';

export interface Customer {
  customerId: number;
  fullName: string;
  phoneNumber: string;
  customerStatus: AccountStatus;
  dateOfBirth?: string;
  address?: string;
  accounts?: AccountResponse[];
}

export interface CustomerRequest {
  fullName: string;
  phoneNumber: string;
  dateOfBirth?: string;
  address?: string;
}

