import type {
  Address,
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  Hash,
  Hex,
  SuiTransaction,
  SuiPaginatedCoins,
  SuiExecutionResult,
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

export interface ISuiWalletProvider {
  getWalletAddress: () => Address;
  getWalletAddressBytes: () => Hex;
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

export interface IIconWalletProvider {
  getWalletAddress: () => IconEoaAddress;
  getWalletAddressBytes: () => Hex;
  sendTransaction: (iconRawTx: IcxCallTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<IconTransactionResult>;
}
