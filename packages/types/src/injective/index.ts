import type { Hex, WalletAddressProvider } from '../common/index.js';
import type { JsonObject, CWRawTransaction } from '../cosmos/index.js';

export type InjectiveEoaAddress = string;

export interface InjectiveCoin {
  readonly denom: string;
  readonly amount: string;
}

export interface InjectiveExecuteResult {
  readonly logs: readonly any[];
  /** Block height in which the transaction is included */
  readonly height: number;
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string;
  readonly events: readonly any[];
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
  logs?: any[];
  info?: string;
  gasWanted: number;
  gasUsed: number;
  timestamp: string;
  events?: any[];
}

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
  getRawTransaction(
    chainId: string,
    _: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): CWRawTransaction;
  getWalletAddress: () => Promise<InjectiveEoaAddress>;
  getWalletAddressBytes: () => Promise<Hex>;
  execute: (
    senderAddress: InjectiveEoaAddress,
    contractAddress: string,
    msg: JsonObject,
    fee: 'auto' | number,
    memo?: string,
    funds?: InjectiveCoin[],
  ) => Promise<InjectiveExecuteResponse>;
  queryContractSmart: (address: string, queryMsg: JsonObject) => Promise<JsonObject>;
}
