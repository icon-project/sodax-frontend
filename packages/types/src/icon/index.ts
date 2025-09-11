import type { Hex, WalletAddressProvider, Hash } from '../common/index.js';

export type IconEoaAddress = `hx${string}`;
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

export interface IIconWalletProvider extends WalletAddressProvider {
  getWalletAddress: () => Promise<IconEoaAddress>;
  sendTransaction: (iconRawTx: IcxCallTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<IconTransactionResult>;
}
