import { networkFrom, type StacksNetwork } from '@stacks/network';
import {
  Cl,
  fetchCallReadOnlyFunction,
  PostConditionMode,
  serializeCV,
  type ClarityValue,
  type PostConditionModeName,
} from '@stacks/transactions';
import type { StacksProvider } from '@stacks/connect';
import { request } from '@stacks/connect';
import type { Hex, IStacksWalletProvider, StacksTransactionParams } from '@sodax/types';

function toPostConditionModeName(mode?: PostConditionMode): PostConditionModeName | undefined {
  if (mode === undefined) return undefined;
  return mode === PostConditionMode.Allow ? 'allow' : 'deny';
}

export class StacksBrowserWalletProvider implements IStacksWalletProvider {
  private address: string;
  private networkName: 'testnet' | 'mainnet';
  private network: StacksNetwork;
  private provider?: StacksProvider;

  constructor(address: string, network: 'testnet' | 'mainnet' = 'mainnet', provider?: StacksProvider) {
    this.address = address;
    this.networkName = network;
    this.network = networkFrom(network);
    this.provider = provider;
  }

  async sendTransaction(txParams: StacksTransactionParams): Promise<string> {
    const contract = `${txParams.contractAddress}.${txParams.contractName}` as `${string}.${string}`;

    const params = {
      contract,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      network: this.networkName,
      postConditions: txParams.postConditions,
      postConditionMode: toPostConditionModeName(txParams.postConditionMode),
    };

    const result = this.provider
      ? await request({ provider: this.provider }, 'stx_callContract', params)
      : await request('stx_callContract', params);

    if (!result.txid) {
      throw new Error('Transaction failed: no txid returned');
    }

    return result.txid;
  }

  async readContract(txParams: StacksTransactionParams): Promise<ClarityValue> {
    return fetchCallReadOnlyFunction({
      contractAddress: txParams.contractAddress,
      contractName: txParams.contractName,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      network: this.network,
      senderAddress: this.address,
    });
  }

  async getWalletAddress(): Promise<string> {
    return this.address;
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
    return `0x${serializeCV(Cl.principal(this.address))}` as Hex;
  }
}
