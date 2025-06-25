import type { Hex, WalletAddressProvider } from '../common/index.js';

export type CosmosNetworkEnv = 'TestNet' | 'DevNet' | 'Mainnet';

export type JsonObject = any;

export interface CWCoin {
  readonly denom: string;
  readonly amount: string;
}

export interface CWStdFee {
  readonly amount: readonly CWCoin[];
  readonly gas: string;
  /** The granter address that is used for paying with feegrants */
  readonly granter?: string;
  /** The fee payer address. The payer must have signed the transaction. */
  readonly payer?: string;
}

export interface CWExecuteResult {
  readonly logs: readonly any[];
  /** Block height in which the transaction is included */
  readonly height: number;
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string;
  readonly events: readonly any[];
  readonly gasWanted: bigint;
  readonly gasUsed: bigint;
}

export interface CWTxResponse {
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

export type CWRawTransaction = {
  from: Hex;
  to: Hex;
  signedDoc: SignDoc;
};

export class CWExecuteResponse {
  public height: number | undefined;

  public transactionHash!: string;

  public static fromExecResult(res: CWExecuteResult): CWExecuteResponse {
    const response = new CWExecuteResponse();
    response.height = res.height;
    response.transactionHash = res.transactionHash;
    return response;
  }

  public static fromTxResponse(res: CWTxResponse): CWExecuteResponse {
    const response = new CWExecuteResponse();
    response.height = res.height;
    response.transactionHash = res.txHash;
    return response;
  }
}

export interface ICWWalletProvider extends WalletAddressProvider {
  getWalletAddress: () => Promise<string>;
  getWalletAddressBytes: () => Promise<Hex>;

  execute(
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    fee: CWStdFee | 'auto' | number,
    memo?: string,
    funds?: CWCoin[],
  ): Promise<CWExecuteResponse>;
  getRawTransaction(
    chainId: string,
    prefix: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): CWRawTransaction;
  queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject>;
}
