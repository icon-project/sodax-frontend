import type { ICoreWallet } from '../index.js';

export interface SignDoc {
  /**
   * body_bytes is protobuf serialization of a TxBody that matches the
   * representation in TxRaw.
   */
  bodyBytes: Uint8Array;
  /**
   * auth_info_bytes is a protobuf serialization of an AuthInfo that matches the
   * representation in TxRaw.
   */
  authInfoBytes: Uint8Array;
  /**
   * chain_id is the unique identifier of the chain this transaction targets.
   * It prevents signed transactions from being used on another chain by an
   * attacker
   */
  chainId: string;
  /** account_number is the account number of the account in state */
  accountNumber: bigint;
}

export type JsonObject = unknown;

export type InjectiveEoaAddress = string;

export interface InjectiveCoin {
  readonly denom: string;
  readonly amount: string;
}

export interface InjectiveExecuteResult {
  readonly logs: readonly unknown[];
  /** Block height in which the transaction is included */
  readonly height: number;
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string;
  readonly events: readonly unknown[];
  readonly gasWanted: bigint;
  readonly gasUsed: bigint;
}

export interface InjectiveTxResponse {
  height: number;
  txHash: string;
  codespace: string;
  code: number;
  data?: string;
  rawLog: string;
  logs?: unknown[];
  info?: string;
  gasWanted: number;
  gasUsed: number;
  timestamp: string;
  events?: unknown[];
}

export type InjectiveReturnType<Raw extends boolean> = Raw extends true
  ? InjectiveRawTransaction
  : Raw extends false
    ? string
    : InjectiveRawTransaction | string;

export type InjectiveRawTransaction = {
  from: `0x${string}`;
  to: `0x${string}`;
  signedDoc: SignDoc;
};

export type InjectiveExecuteResponse = {
  height: number | undefined;
  transactionHash: string;
};

export type InjectiveEventAttribute = {
  key: string;
  value: string;
  index: boolean;
};

export type InjectiveEvent = {
  type: string;
  attributes: InjectiveEventAttribute[];
};

export type InjectiveStringEvent = {
  type: string;
  attributes: { key: string; value: string }[];
};

export type InjectiveTxLog = {
  msg_index: number;
  log: string;
  events: InjectiveStringEvent[];
};

/** Mirrors `TxResponse` from `@injectivelabs/sdk-ts` (Cosmos SDK). */
export type InjectiveRawTransactionReceipt = {
  txHash: string;
  height: number;
  code: number;
  codespace: string;
  data: string;
  rawLog: string;
  info: string;
  gasWanted: number;
  gasUsed: number;
  logs: InjectiveTxLog[];
  events: InjectiveEvent[];
  timestamp: string;
};

export interface IInjectiveWalletProvider extends ICoreWallet {
  readonly chainType: 'INJECTIVE';
  getWalletAddress: () => Promise<InjectiveEoaAddress>;
  execute: (
    senderAddress: InjectiveEoaAddress,
    contractAddress: string,
    msg: JsonObject,
    funds?: InjectiveCoin[],
  ) => Promise<InjectiveExecuteResponse>;
}
