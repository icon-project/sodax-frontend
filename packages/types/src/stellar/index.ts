import type { WalletAddressProvider } from '../common/index.js';

export type XDR = string;

// Stellar Horizon API based transaction receipt
export type StellarRawTransactionReceipt = {
  _links: {
    self: { href: string };
    account: { href: string };
    ledger: { href: string };
    operations: { href: string };
    effects: { href: string };
    precedes: { href: string };
    succeeds: { href: string };
    transaction: { href: string };
  };
  id: string; // Transaction ID
  paging_token: string; // Pagination token for streaming or querying
  successful: boolean; // Indicates if the transaction was successful
  hash: string; // Transaction hash
  ledger_attr: number; // Ledger sequence number
  created_at: string; // ISO 8601 timestamp of when the transaction was created
  source_account: string; // Source account public key
  source_account_sequence: string; // Sequence number of the source account
  fee_account: string; // Account that paid the fee (for fee bump transactions)
  fee_bump_transaction?: {
    hash: string; // Hash of the fee bump transaction
    signatures: string[]; // Signatures for the fee bump transaction
  };
  inner_transaction?: {
    hash: string; // Hash of the inner transaction (for fee bump transactions)
    signatures: string[]; // Signatures for the inner transaction
  };
  envelope_xdr: XDR; // Base64-encoded XDR of the transaction envelope
  result_xdr: XDR; // Base64-encoded XDR of the transaction result
  result_meta_xdr: XDR; // Base64-encoded XDR of the transaction metadata
  fee_meta_xdr: XDR; // Base64-encoded XDR of fee-related metadata
  memo?: string; // Memo content (if any)
  memo_type?: string; // Type of memo (e.g., "text", "id", "hash", "return")
  signatures: XDR[]; // Array of Base64-encoded signatures
  valid_after?: string; // Minimum time bound (if set)
  valid_before?: string; // Maximum time bound (if set)
  fee_charged: number | string; // Fee charged for the transaction (in stroops)
  max_fee: number | string; // Maximum fee specified (in stroops)
  operation_count: number; // Number of operations in the transaction to fetch the next transaction
};

export type StellarRawTransaction = {
  from: string;
  to: string;
  value: bigint;
  data: string;
};

export interface IStellarWalletProvider extends WalletAddressProvider {
  signTransaction: (tx: XDR) => Promise<XDR>;
  waitForTransactionReceipt: (txHash: string) => Promise<StellarRawTransactionReceipt>;
}
