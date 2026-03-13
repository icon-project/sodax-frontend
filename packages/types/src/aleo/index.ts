import type { WalletAddressProvider } from "../common/index.js";

export type AleoEoaAddress = `aleo1${string}`;
export type AleoTransactionId = `at1${string}`;
export type AleoProgramId = `${string}.aleo`;

export type AleoNetworkEnv = "mainnet" | "testnet";
export type AleoTransactionStatus = "accepted" | "rejected";

export interface AleoRecordPlaintext {
  microcredits(): bigint;
  nonce(): string;
  toString(): string;
}

export interface AleoTransaction {
  transitions(): AleoTransition[];
  toString(): string;
}

export interface AleoTransition {
  outputs(): AleoOutput[];
}

export interface AleoOutput {
  toString(): string;
}

export interface AleoExecuteOptions {
  programName: string;
  functionName: string;
  inputs: string[];
  priorityFee?: number;
  privateFee?: boolean;
  feeRecord?: string | AleoRecordPlaintext;
}

export interface AleoExecutionResult {
  transactionId: string;
  transaction?: AleoTransaction;
  outputs?: string[];
}

export interface AleoTransactionReceipt {
  transactionId: string;
  status: AleoTransactionStatus;
  type: string;
  index: bigint;
  transaction: unknown;
  finalize: unknown[];
  confirmedAt: Date;
}

export interface AleoWaitForReceiptOptions {
  checkInterval?: number;
  timeout?: number;
}

export type AleoRawTransaction = {
  from: string;
  to: AleoProgramId;
  value: bigint;
  data: AleoExecuteOptions;
};
//! Use the same encodeAleoAddress from shared file.
export interface IAleoWalletProvider extends WalletAddressProvider {
  getWalletAddress: () => Promise<string>;
  execute: (options: AleoExecuteOptions) => Promise<AleoExecutionResult>;
  waitForTransactionReceipt: (
    transactionId: string,
    options?: AleoWaitForReceiptOptions
  ) => Promise<AleoTransactionReceipt>;
  executeAndWait: (
    options: AleoExecuteOptions,
    receiptOptions?: AleoWaitForReceiptOptions
  ) => Promise<{
    result: AleoExecutionResult;
    receipt: AleoTransactionReceipt;
  }>;
}
