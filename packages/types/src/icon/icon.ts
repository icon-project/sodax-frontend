import type { Hex, Hash } from '../shared/shared.js';
import type { ICoreWallet } from '../wallet/wallet.js';
import { spokeChainConfig, ChainKeys } from '../chains/chains.js';

export type IcxTokenType =
  | (typeof spokeChainConfig)[typeof ChainKeys.ICON_MAINNET]['addresses']['wICX']
  | (typeof spokeChainConfig)[typeof ChainKeys.ICON_MAINNET]['nativeToken'];

export type IconEoaAddress = `hx${string}`;

export type IconRawTransaction = {
  [key: string]: string | object;
};
export type IconReturnType<Raw extends boolean> = Raw extends true
  ? IconRawTransaction
  : Raw extends false
    ? Hex
    : IconRawTransaction | Hex;

export type IcxRawTransaction = {
  to: string;
  from: string;
  value: Hex;
  stepLimit: Hex;
  nid: Hex;
  nonce: Hex;
  version: Hex;
  timestamp: Hex;
  data: Hex;
};

export type IcxCallTransaction = {
  to: string;
  from: string;
  nid: Hex;
  value: Hex;
  method: string;
  params: object;
  version?: Hex;
  timestamp?: number;
};

export type IconTransactionResult = {
  status: number;
  to: string;
  txHash: string;
  txIndex: number;
  blockHeight: number;
  blockHash: string;
  cumulativeStepUsed: bigint;
  stepUsed: bigint;
  stepPrice: bigint;
  scoreAddress?: string;
  eventLogs?: unknown;
  logsBloom?: unknown;
  failure?: {
    code: string;
    message: string;
  };
};

export interface IIconWalletProvider extends ICoreWallet {
  readonly chainType: 'ICON';
  getWalletAddress: () => Promise<IconEoaAddress>;
  sendTransaction: (iconRawTx: IcxCallTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<IconTransactionResult>;
}
