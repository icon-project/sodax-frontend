import type { PaginatedCoins, SuiExecutionResult } from '@mysten/sui/client';
import type { Transaction, TransactionArgument } from '@mysten/sui/transactions';

import type { Address, EvmRawTransaction, EvmRawTransactionReceipt, Hash, Hex } from './index.js';

export interface IEvmWalletProvider {
  getWalletAddress: () => Address;
  getWalletAddressBytes: () => Hex;
  sendTransaction: (evmRawTx: EvmRawTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<EvmRawTransactionReceipt>;
}

export interface ISuiWalletProvider {
  getWalletAddress: () => Address;
  getWalletAddressBytes: () => Hex;
  signAndExecuteTxn: (txn: Transaction) => Promise<Hex>;
  viewContract(
    tx: Transaction,
    packageId: string,
    module: string,
    functionName: string,
    args: TransactionArgument[],
    typeArgs: string[],
  ): Promise<SuiExecutionResult>;
  getCoins: (address: string, token: string) => Promise<PaginatedCoins>;
}
