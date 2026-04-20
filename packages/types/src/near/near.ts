import type { Hex, ICoreWallet } from '../index.js';
import type { RpcTransactionResponse } from './near-api-js.js';

export interface TransferArgs {
  token: string;
  to: Array<number>;
  amount: string;
  data: Array<number>;
}

export interface SendMsgArgs {
  dst_chain_id: number;
  dst_address: Array<number>;
  payload: Array<number>;
}

export interface FillData {
  token: string;
  fill_id: bigint;
  intent_hash: Hex;
  solver: Hex;
  receiver: string;
  amount: bigint;
}

export interface FillIntent {
  token: Array<number>;
  fill_id: string;
  intent_hash: Array<number>;
  solver: Array<number>;
  receiver: Array<number>;
  amount: string;
}

export interface FillIntentArgs {
  fill: FillIntent;
}

export interface FTTransferCallArgs {
  receiver_id: string;
  amount: string;
  memo?: string;
  msg?: string;
}

export interface NearTransferArgs {
  to: Array<number>;
  amount: string;
  data: Array<number>;
}

export interface InitArgs {
  connection: string;
  rate_limit: string;
  hub_chain_id: number;
  hub_asset_manager: number[];
}
export interface SetHubConfig {
  hub_chain_id: number;
  hub_asset_manager: number[];
}

export type ContractArgs =
  | TransferArgs
  | InitArgs
  | SetHubConfig
  | FTTransferCallArgs
  | NearTransferArgs
  | SendMsgArgs
  | FillIntentArgs;

export interface CallContractParams {
  contractId: string;
  method: string;
  args: ContractArgs;
  gas?: bigint;
  deposit?: bigint;
}

export type NearRawTransaction = {
  signerId: string;
  params: CallContractParams;
};

export type NearReturnType<Raw extends boolean> = Raw extends true ? NearRawTransaction : string;

export type NearRawTransactionReceipt = RpcTransactionResponse;

export interface INearWalletProvider extends ICoreWallet {
  readonly chainType: 'NEAR';
  getWalletAddress: () => Promise<string>;
  getRawTransaction(params: CallContractParams): Promise<NearRawTransaction>;
  signAndSubmitTxn(tx: NearRawTransaction): Promise<string>;
}
