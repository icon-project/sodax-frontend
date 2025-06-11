import type {
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  Hash,
  StellarRawTransactionReceipt,
  XDR,
  IconTransactionResult,
  IcxCallTransaction,
  WalletAddressProvider,
} from './index.js';

export interface IEvmWalletProvider extends WalletAddressProvider {
  sendTransaction: (evmRawTx: EvmRawTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<EvmRawTransactionReceipt>;
}

export interface IStellarWalletProvider extends WalletAddressProvider {
  signTransaction: (tx: XDR) => Promise<XDR>;
  waitForTransactionReceipt: (txHash: string) => Promise<StellarRawTransactionReceipt>;
}

export interface IIconWalletProvider extends WalletAddressProvider {
  sendTransaction: (iconRawTx: IcxCallTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<IconTransactionResult>;
}
