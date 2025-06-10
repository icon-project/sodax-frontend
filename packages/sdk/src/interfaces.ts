import type {
  Address,
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  Hash,
  Hex,
  SuiTransaction,
  SuiPaginatedCoins,
  SuiExecutionResult,
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
