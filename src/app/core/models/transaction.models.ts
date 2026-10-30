export type TransactionType = 'TRANSFER' | 'DEPOSIT' | 'WITHDRAW';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface TransactionResponse {
  transactionId: number;
  refNo: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  status: TransactionStatus;
  tranType: TransactionType;
  createAt?: string;
  failureReason?: string;
}

export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
}

export interface DepositRequest {
  accountNumber: string;
  amount: number;
}

export interface WithdrawRequest {
  accountNumber: string;
  amount: number;
}
