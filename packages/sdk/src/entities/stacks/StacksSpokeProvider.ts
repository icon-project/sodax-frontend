import type { IStacksWalletProvider } from "@sodax/types";
import type { ISpokeProvider } from "../Providers.js";
import type { StacksSpokeChainConfig } from "../../types.js";
import { STACKS_MAINNET, type StacksNetwork } from '@stacks/network';
import { Cl, parseContractId, type ContractIdString, type UIntCV } from "@stacks/transactions";


export class StacksSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IStacksWalletProvider;
  public chainConfig: StacksSpokeChainConfig;
  private network: StacksNetwork;

  constructor(config: StacksSpokeChainConfig, wallet_provider: IStacksWalletProvider, network: StacksNetwork = STACKS_MAINNET) {
    this.chainConfig = config;
    this.walletProvider = wallet_provider;
    this.network = network;
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
}

