import type { ClarityValue, PostConditionMode } from '@stacks/transactions';
import type { WalletAddressProvider } from '../common/index.js';

export type StacksTransactionParams = {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  postConditionMode?: PostConditionMode;
};

export interface IStacksWalletProvider extends WalletAddressProvider {
  getWalletAddress: () => Promise<string>;
  getBalance: (address: string) => Promise<bigint>;
  sendTransaction: (txParams: StacksTransactionParams) => Promise<string>;
  readContract: (txParams: StacksTransactionParams) => Promise<ClarityValue>;
}