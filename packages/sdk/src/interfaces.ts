import type {
  Address,
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  Hash,
  Hex,
  StellarRawTransactionReceipt,
  StellarSimulationResult,
  XDR,
} from './index.js';

export interface IEvmWalletProvider {
  getWalletAddress: () => Address;
  getWalletAddressBytes: () => Hex;
  sendTransaction: (evmRawTx: EvmRawTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<EvmRawTransactionReceipt>;
}

/**
 * Interface for Stellar blockchain wallet operations
 * Provides methods for address management, transaction simulation, signing, transaction sending and receipt retrieval
 */
export interface IStellarWalletProvider {
  /** Returns the wallet's public key as a string */
  getWalletAddress: () => string;

  /** Returns the wallet's public key as a hex string */
  getWalletAddressBytes: () => Hex;

  /**
   * Simulates a transaction before sending
   * @param tx - Base64-encoded XDR transaction envelope
   * @returns Promise resolving to simulation results including resource costs and potential errors
   */
  simulateTransaction: (tx: XDR) => Promise<StellarSimulationResult>;

  /**
   * Signs a transaction with the wallet's private key
   * @param tx - Base64-encoded XDR transaction envelope
   * @returns Promise resolving to signed transaction as XDR
   */
  signTransaction: (tx: XDR) => Promise<XDR>;

  /**
   * Sends a transaction to the Stellar network and returns its hash
   * @param tx - Base64-encoded XDR transaction envelope containing the signed transaction
   * @returns Promise resolving to the transaction hash that can be used to track the transaction
   */
  sendTransaction: (tx: XDR) => Promise<string>;

  /**
   * Waits for a transaction to be confirmed and returns its receipt
   * @param txHash - Transaction hash to look up
   * @returns Promise resolving to transaction receipt with status and metadata
   */
  waitForTransactionReceipt: (txHash: string) => Promise<StellarRawTransactionReceipt>;
}
