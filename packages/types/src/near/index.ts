import type { Hex, WalletAddressProvider } from '../common/index.js';

export interface TransferArgs {
  token: string;
  to: Array<Number>;
  amount: string;
  data: Array<Number>;
}

export interface SendMsgArgs {
  dst_chain_id: number;
  dst_address: Array<Number>;
  payload: Array<Number>;
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
  token: Array<Number>;
  fill_id: string;
  intent_hash: Array<Number>;
  solver: Array<Number>;
  receiver: Array<Number>;
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
  to: Array<Number>;
  amount: string;
  data: Array<Number>;
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

export interface INearWalletProvider extends WalletAddressProvider {
  getWalletAddress: () => Promise<string>;
  getWalletAddressBytes: () => Promise<Hex>;
  getRawTransaction(params: CallContractParams): Promise<NearRawTransaction>;
  signAndSubmitTxn(tx: NearRawTransaction): Promise<string>;
}
