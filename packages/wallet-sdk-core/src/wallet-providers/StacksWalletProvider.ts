const { makeContractCall, broadcastTransaction } = await import('@stacks/transactions');
import { networkFrom, type StacksNetwork } from '@stacks/network';

import {
  Cl,
  fetchCallReadOnlyFunction,
  getAddressFromPrivateKey,
  PostConditionMode,
  type ClarityValue,
  serializeCV
} from '@stacks/transactions';

import type { Hex, IStacksWalletProvider } from '@sodax/types';

export type StacksTransactionParams = {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  postConditionMode?: PostConditionMode;
};

export class StacksWalletProvider implements IStacksWalletProvider {
  private privateKey: string;
  private network: StacksNetwork;

  constructor(pk: string, network: 'testnet' | 'mainnet' = 'mainnet') {
    this.privateKey = pk;
    this.network = networkFrom(network);
  }

 async sendTransaction(txParams: StacksTransactionParams): Promise<string> {
      const transaction = await makeContractCall({
        contractAddress: txParams.contractAddress,
        contractName: txParams.contractName,
        functionName: txParams.functionName,
        functionArgs: txParams.functionArgs,
        senderKey: this.privateKey,
        network: this.network,
        postConditionMode: txParams.postConditionMode,
      });

      const result = await broadcastTransaction({
        network: this.network,
        transaction,
      });

      console.log(result);
      return result.txid;
  }

  async readContract(txParams: StacksTransactionParams): Promise<ClarityValue> {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: txParams.contractAddress,
      contractName: txParams.contractName,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      network: this.network,
      senderAddress: (await this.getWalletAddress()),
    });

    return result;
  }

  async getWalletAddress(): Promise<string> {
    return getAddressFromPrivateKey(this.privateKey, this.network);
  }

  async getBalance(address: string): Promise<bigint> {
    return 0n;
  }

  async getWalletAddressBytes(): Promise<Hex> {
    return `0x${serializeCV(Cl.principal(await this.getWalletAddress()))}` as Hex;
  }
}


