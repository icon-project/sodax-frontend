import type { Hex, WalletAddressProvider } from '../common/index.js';

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

export type InjectiveNetworkEnv = 'TestNet' | 'DevNet' | 'Mainnet';

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

export type InjectiveRawTransaction = {
  from: Hex;
  to: Hex;
  signedDoc: SignDoc;
};

export class InjectiveExecuteResponse {
  public height: number | undefined;

  public transactionHash!: string;

  public static fromExecResult(res: InjectiveExecuteResult): InjectiveExecuteResponse {
    const response = new InjectiveExecuteResponse();
    response.height = res.height;
    response.transactionHash = res.transactionHash;
    return response;
  }

  public static fromTxResponse(res: InjectiveTxResponse): InjectiveExecuteResponse {
    const response = new InjectiveExecuteResponse();
    response.height = res.height;
    response.transactionHash = res.txHash;
    return response;
  }
}

export interface IInjectiveWalletProvider extends WalletAddressProvider {
  getWalletAddress: () => Promise<InjectiveEoaAddress>;
  execute: (
    senderAddress: InjectiveEoaAddress,
    contractAddress: string,
    msg: JsonObject,
    funds?: InjectiveCoin[],
  ) => Promise<InjectiveExecuteResponse>;
}
