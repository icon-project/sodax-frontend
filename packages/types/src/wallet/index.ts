import type { EvmRawTransaction, EvmRawTransactionReceipt } from '../evm/index.js';
import type { IconEoaAddress, IcxCallTransaction, IconTransactionResult } from '../icon/index.js';
import type { EvmAddress, Hash, Hex } from '../shared/index.js';
import type { SuiTransaction, SuiExecutionResult, SuiPaginatedCoins } from '../sui/index.js';

export interface IEvmWalletProvider {
  getWalletAddress: () => EvmAddress;
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

export interface ISuiWalletProvider {
  getWalletAddress: () => EvmAddress;
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
