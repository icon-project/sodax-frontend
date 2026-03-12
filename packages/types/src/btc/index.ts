import type { WalletAddressProvider } from "../common/index.js";

export type AddressType = "P2PKH" | "P2WPKH" | "P2TR"

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

export interface IBitcoinWalletProvider extends WalletAddressProvider {
  /**
   * Get the wallet's Bitcoin address
   * @returns Promise resolving to the Bitcoin address
   */
  getWalletAddress(): Promise<string>;

  /**
   * Get the wallet's address type
   * @returns Promise resolving to the address type
   */
  getAddressType(address: string): Promise<AddressType>;

  // /**
  //  * Fetch UTXOs for a given address
  //  * @param address - Bitcoin address to fetch UTXOs for
  //  * @returns Promise resolving to array of UTXOs
  //  */
  // fetchUTXOs(address: string): Promise<UTXO[]>;

  /**
   * Sign a Bitcoin transaction (PSBT format)
   * @param psbtHex - Hex-encoded PSBT transaction
   * @returns Promise resolving to signed transaction hex
   */
  signTransaction(psbt: string, finalize?: boolean): Promise<string>;



  signEcdsaMessage(message: string): Promise<string>

  signBip322Message(message: string): Promise<string>

  // waitForTransactionReceipt: (txHash: string) => Promise<string>;

  /**
   * Broadcast a signed transaction to the Bitcoin network
   * @param txHex - Hex-encoded signed transaction
   * @returns Promise resolving to transaction hash
   */
  // broadcastTransaction(txHex: string): Promise<string>;

  /**
   * Send Bitcoin to an address
   * @param toAddress - Destination Bitcoin address
   * @param satoshis - Amount to send in satoshis
   * @returns Promise resolving to transaction hash
   */
  // sendBitcoin(toAddress: string, satoshis: number): Promise<string>;

  /**
   * Create radfi trading wallet
   * @returns Promise resolving to trading wallet address
   */
  // createRadfiTradingWallet(): Promise<string>;

  /**
   * Fetch trading wallet information from Radfi API
   * @returns Promise resolving to trading wallet information
   */
  // getTradingWallet(): Promise<string>;

  //  public async requestRadfiSignature(psbt: bitcoin.Psbt | string): Promise<RadfiSignatureResponse> {

  /**
   * Request Radfi signature
   * @param psbt - PSBT transaction
   * @returns Promise resolving to signed transaction
   */

  // requestRadfiSignature(psbt: string): Promise<string>;

  // createTransactionThroughTradingWallet(tokenSymbol: string, amount: bigint, recipient: string): Promise<RadfiDepositTxResponse>;

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

export interface RadfiDepositTxResponse {
  base64Psbt: string;
  fee: Fee;
  userInputIndexes: number[];
  txId: string;
}

export interface Fee {
  feeRate: number;
  totalFee: number;
}

// Re-export for convenience
export type { BitcoinRawTransactionReceipt as BitcoinTransactionReceipt };

