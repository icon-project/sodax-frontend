import type {
  Address,
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  Hash,
  Hex,
  StellarRawTransactionReceipt,
  XDR,
  IconEoaAddress,
  IconTransactionResult,
  IcxCallTransaction,
} from './index.js';

export interface IEvmWalletProvider {
  getWalletAddress: () => Address;
  getWalletAddressBytes: () => Hex;
  sendTransaction: (evmRawTx: EvmRawTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<EvmRawTransactionReceipt>;
}

/**
 * Interface for Stellar blockchain wallet operations
 * Provides methods for address management, signing and receipt retrieval
 */
export interface IStellarWalletProvider {
  /** Returns the wallet's public key as a string */
  getWalletAddress: () => string;

  /** Returns the wallet's public key as a hex string */
  getWalletAddressBytes: () => Hex;

  /**
   * Signs a transaction with the wallet's private key
   * @param tx - Base64-encoded XDR transaction envelope
   * @returns Promise resolving to signed transaction as XDR
   */
  signTransaction: (tx: XDR) => Promise<XDR>;

  /**
   * Waits for a transaction to be confirmed and returns its receipt
   * @param txHash - Transaction hash to look up
   * @returns Promise resolving to transaction receipt with status and metadata
   */
  waitForTransactionReceipt: (txHash: string) => Promise<StellarRawTransactionReceipt>;
}

export interface IIconWalletProvider {
  getWalletAddress: () => IconEoaAddress;
  getWalletAddressBytes: () => Hex;
  sendTransaction: (iconRawTx: IcxCallTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<IconTransactionResult>;
}
