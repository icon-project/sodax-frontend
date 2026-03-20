import type {
  IStacksWalletProvider,
  StacksSpokeChainConfig,
  StacksTransactionParams,
  WalletAddressProvider,
} from '@sodax/types';
import type { IRawSpokeProvider, ISpokeProvider } from '../Providers.js';
import { networkFrom, type StacksNetwork } from '@stacks/network';
import {
  Cl,
  type ClarityValue,
  fetchCallReadOnlyFunction,
  parseContractId,
  type ContractIdString,
  type ContractPrincipalCV,
  type UIntCV,
} from '@stacks/transactions';

abstract class StacksBaseSpokeProvider {
  public chainConfig: StacksSpokeChainConfig;
  protected network: StacksNetwork;

  constructor(config: StacksSpokeChainConfig) {
    this.chainConfig = config;
    this.network = networkFrom('mainnet');
    this.network.client.baseUrl = config.rpcUrl;
  }

  async getSTXBalance(address: string): Promise<bigint> {
    const url = `${this.network.client.baseUrl}/extended/v1/address/${address}/balances`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching STX balance: ${response.statusText}`);
    }
    const data = await response.json();
    return BigInt(data.stx.balance);
  }

  async readTokenBalance(token: string, address: string): Promise<bigint> {
    const [contractAddress, contractName] = parseContractId(token as ContractIdString);
    const result = (await fetchCallReadOnlyFunction({
      contractAddress: contractAddress as string,
      contractName: contractName as string,
      functionName: 'get-balance',
      functionArgs: [Cl.principal(address)],
      network: this.network,
      senderAddress: address,
    })) as { value: UIntCV };
    return result.value.value as bigint;
  }

  async getImplContractAddress(stateContract: string): Promise<string> {
    const [contractAddress, contractName] = parseContractId(stateContract as ContractIdString);
    const txParams = {
      contractAddress: contractAddress as string,
      contractName: contractName as string,
      functionName: 'get-asset-manager-impl',
      functionArgs: [],
    };

    const implAddress: string = ((await this.walletReadContract(txParams)) as ContractPrincipalCV).value;
    return implAddress;
  }

  protected abstract walletReadContract(txParams: StacksTransactionParams): Promise<ClarityValue>;
}

export class StacksSpokeProvider extends StacksBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IStacksWalletProvider;

  constructor(config: StacksSpokeChainConfig, walletProvider: IStacksWalletProvider) {
    super(config);
    this.walletProvider = walletProvider;
  }

  protected override async walletReadContract(txParams: StacksTransactionParams) {
    return this.walletProvider.readContract(txParams);
  }
}

export type StacksRawSpokeProviderConfig = {
  walletAddress: string;
  chainConfig: StacksSpokeChainConfig;
};

export class StacksRawSpokeProvider extends StacksBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(walletAddress: string, config: StacksSpokeChainConfig) {
    super(config);
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
    };
  }

  protected override async walletReadContract(txParams: StacksTransactionParams) {
    return fetchCallReadOnlyFunction({
      contractAddress: txParams.contractAddress,
      contractName: txParams.contractName,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      network: this.network,
      senderAddress: await this.walletProvider.getWalletAddress(),
    });
  }
}
