import type { IStacksWalletProvider } from "@sodax/types";
import type { ISpokeProvider } from "../Providers.js";
import type { StacksChainConfig } from "../../types.js";
import { networkFrom, type StacksNetwork } from '@stacks/network';
import { Cl, parseContractId, type ContractIdString, type ContractPrincipalCV, type UIntCV } from "@stacks/transactions";


export class StacksSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IStacksWalletProvider;
  public chainConfig: StacksChainConfig;
  private network: StacksNetwork;

  constructor(config: StacksChainConfig, wallet_provider: IStacksWalletProvider, network: 'testnet' | 'mainnet' = 'mainnet', rpcUrl?: string) {
    this.chainConfig = config;
    this.walletProvider = wallet_provider;
    this.network = networkFrom(network);
    this.network.client.baseUrl = rpcUrl ?? this.network.client.baseUrl;
  }

  async getSTXBalance(address: string): Promise<bigint> {
    const url = `${this.network.client.baseUrl}/extended/v1/address/${address}/balances`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      const data = await response.json();
      return data.stx.balance;
    } catch (error) {
      console.error('Error:', error);
      return 0n;
    }
  }

  async readTokenBalance(token: String, address: string): Promise<bigint> {
    const txParams = {
      contractAddress: parseContractId(token as `${string}.${string}` as ContractIdString)[0] as string,
      contractName: parseContractId(token as `${string}.${string}` as ContractIdString)[1] as string,
      functionName: 'balance-of',
      functionArgs: [Cl.principal(address)],
    };

    const balance: UIntCV = await this.walletProvider.readContract(txParams) as UIntCV;

    return balance.value as bigint;
  }

  async getImplContractAddress(stateContract: String): Promise<string> {
    const txParams = {
      contractAddress: parseContractId(stateContract as `${string}.${string}` as ContractIdString)[0] as string,
      contractName: parseContractId(stateContract as `${string}.${string}` as ContractIdString)[1] as string,
      functionName: 'get-asset-manager-impl',
      functionArgs: [],
    };

    const implAddress: string = (await this.walletProvider.readContract(txParams) as ContractPrincipalCV).value;
    return implAddress;
  }
}