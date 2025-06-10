import type {
  Address,
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  Hash,
  Hex,
  IconEoaAddress,
  IconTransactionResult,
  IcxCallTransaction,
} from './index.js';

export interface IEvmWalletProvider {
  getWalletAddress: () => Address;
  getWalletAddressBytes: () => Hex;
  sendTransaction: (evmRawTx: EvmRawTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<EvmRawTransactionReceipt>;
}

export interface IIconWalletProvider {
  getWalletAddress: () => IconEoaAddress;
  getWalletAddressBytes: () => Hex;
  sendTransaction: (iconRawTx: IcxCallTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<IconTransactionResult>;
}
