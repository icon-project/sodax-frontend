import { networkFrom, type StacksNetwork } from '@stacks/network';

import {
  Cl,
  broadcastTransaction,
  fetchCallReadOnlyFunction,
  getAddressFromPrivateKey,
  makeContractCall,
  type ClarityValue,
  serializeCV,
} from '@stacks/transactions';

import type { Hex, IStacksWalletProvider, StacksTransactionParams } from '@sodax/types';

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
      postConditions: txParams.postConditions,
    });

    const result = await broadcastTransaction({
      network: this.network,
      transaction,
    });

    return result.txid;
  }

  async readContract(txParams: StacksTransactionParams): Promise<ClarityValue> {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: txParams.contractAddress,
      contractName: txParams.contractName,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      network: this.network,
      senderAddress: await this.getWalletAddress(),
    });

    return result;
  }

  async getWalletAddress(): Promise<string> {
    return getAddressFromPrivateKey(this.privateKey, this.network);
  }

  async getBalance(address: string): Promise<bigint> {
    const url = `${this.network.client.baseUrl}/extended/v1/address/${address}/balances`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();
      return BigInt(data.stx.balance);
    } catch (error) {
      console.error('Error fetching STX balance:', error);
      return 0n;
    }
  }

  async getWalletAddressBytes(): Promise<Hex> {
    return `0x${serializeCV(Cl.principal(await this.getWalletAddress()))}` as Hex;
  }
}
