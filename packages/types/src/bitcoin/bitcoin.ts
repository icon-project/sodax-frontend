import type { ICoreWallet } from '../index.js';

/** Check whether an AddressType is supported for signing/spending. */
export function isSupportedBitcoinAddressType(addressType: string): addressType is BtcAddressType {
  return (BTC_ADDRESS_TYPES as readonly string[]).includes(addressType);
}

/**
 * Detect Bitcoin address type from its prefix.
 * Shared utility — use this instead of duplicating prefix checks.
 */
export function detectBitcoinAddressType(address: string): BtcAddressType {
  if (address.startsWith('bc1p') || address.startsWith('tb1p')) return 'P2TR';
  if (address.startsWith('bc1') || address.startsWith('tb1')) return 'P2WPKH';
  if (address.startsWith('3') || address.startsWith('2')) return 'P2SH';
  if (address.startsWith('1') || address.startsWith('m') || address.startsWith('n')) return 'P2PKH';
  throw new Error(`Unknown Bitcoin address type: ${address}`);
}

export const BTC_WALLET_ADDRESS_TYPES = ['taproot', 'segwit'] as const;
/** User-friendly Bitcoin address type for wallet connection. */
export type BtcWalletAddressType = (typeof BTC_WALLET_ADDRESS_TYPES)[number];

/** Address types that Sodax supports for transactions. */
const BTC_ADDRESS_TYPES = ['P2PKH', 'P2SH', 'P2WPKH', 'P2TR'] as const;

/** Subset of AddressType that Sodax can actually sign/spend from. */
export type BtcAddressType = (typeof BTC_ADDRESS_TYPES)[number];

// Type definitions for @sodax/types - Bitcoin Wallet Provider
export interface BitcoinTransactionStatus {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
}

export interface BitcoinTransactionInput {
  txid: string;
  vout: number;
  prevout?: {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  };
  scriptsig: string;
  scriptsig_asm: string;
  witness?: string[];
  is_coinbase: boolean;
  sequence: number;
  inner_redeemscript_asm?: string;
}

export interface BitcoinTransactionOutput {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address?: string;
  value: number;
}

export interface BitcoinRawTransactionReceipt {
  txid: string;
  version: number;
  locktime: number;
  vin: BitcoinTransactionInput[];
  vout: BitcoinTransactionOutput[];
  size: number;
  weight: number;
  fee?: number;
  status: BitcoinTransactionStatus;
}

export interface RadfiDepositTxResponse {
  base64Psbt: string;
  fee: BitcoinFee;
  userInputIndexes: number[];
  txId: string;
}

export interface BitcoinFee {
  feeRate: number;
  totalFee: number;
}

export type BitcoinRawTransaction = {
  from: string;
  to: string;
  value: bigint;
  data: string;
};

export type BitcoinReturnType<Raw extends boolean> = Raw extends true
  ? BitcoinRawTransaction | string
  : Raw extends false
    ? string
    : BitcoinRawTransaction | string;

export interface IBitcoinWalletProvider extends ICoreWallet {
  readonly chainType: 'BITCOIN';
  /**
   * Get the wallet's Bitcoin address
   * @returns Promise resolving to the Bitcoin address
   */
  getWalletAddress(): Promise<string>;

  /**
   * Sign a Bitcoin transaction (PSBT format)
   * @param psbtHex - Hex-encoded PSBT transaction
   * @returns Promise resolving to signed transaction hex
   */
  signTransaction(psbt: string, finalize?: boolean): Promise<string>;

  signEcdsaMessage(message: string): Promise<string>;

  signBip322Message(message: string): Promise<string>;

  /**
   * Send Bitcoin to an address
   * @param toAddress - Destination Bitcoin address
   * @param satoshis - Amount to send in satoshis
   * @returns Promise resolving to transaction hash
   */
  sendBitcoin(toAddress: string, satoshis: bigint): Promise<string>;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}
