import type {
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  Hash,
  StellarRawTransactionReceipt,
  SuiTransaction,
  SuiPaginatedCoins,
  SuiExecutionResult,
  XDR,
  IconTransactionResult,
  IcxCallTransaction,
  WalletAddressProvider,
  Hex,
} from './index.js';

export interface IEvmWalletProvider extends WalletAddressProvider {
  sendTransaction: (evmRawTx: EvmRawTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<EvmRawTransactionReceipt>;
}

export interface ISuiWalletProvider extends WalletAddressProvider {
  signAndExecuteTxn: (txn: SuiTransaction) => Promise<Hex>;
  viewContract(
    tx: SuiTransaction,
    packageId: string,
    module: string,
    functionName: string,
    args: unknown[],
    typeArgs: string[],
  ): Promise<SuiExecutionResult>;
  getCoins: (address: string, token: string) => Promise<SuiPaginatedCoins>;
}

export interface IStellarWalletProvider extends WalletAddressProvider {
  signTransaction: (tx: XDR) => Promise<XDR>;
  waitForTransactionReceipt: (txHash: string) => Promise<StellarRawTransactionReceipt>;
}

export interface IIconWalletProvider extends WalletAddressProvider {
  sendTransaction: (iconRawTx: IcxCallTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<IconTransactionResult>;
}
