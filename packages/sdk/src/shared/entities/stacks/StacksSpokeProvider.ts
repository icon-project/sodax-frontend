import type {
  IStacksWalletProvider,
  StacksSpokeChainConfig,
  StacksTransactionParams,
  WalletAddressProvider,
} from '@sodax/types';
import type { IRawSpokeProvider, ISpokeProvider } from '../Providers.js';
import type { StacksNetwork } from '@stacks/network';
import type {
  ClarityValue,
  ContractIdString,
  ContractPrincipalCV,
  UIntCV,
} from '@stacks/transactions';
import { loadStacksTransactions } from '../../utils/stacks-utils.js';

// Lazy load @stacks/network to avoid Next.js 16 Turbopack scope-hoisting cycle (issue #1070).
let _stacksNet: typeof import('@stacks/network') | undefined;
async function loadStacksNetwork(): Promise<typeof import('@stacks/network')> {
  if (!_stacksNet) {
    _stacksNet = await import('@stacks/network');
  }
  return _stacksNet;
}

abstract class StacksBaseSpokeProvider {
  public chainConfig: StacksSpokeChainConfig;
  protected _network?: StacksNetwork;

  constructor(config: StacksSpokeChainConfig) {
    this.chainConfig = config;
  }

  protected async getNetwork(): Promise<StacksNetwork> {
    if (!this._network) {
      const { createNetwork } = await loadStacksNetwork();
      this._network = createNetwork({ network: 'mainnet', client: { baseUrl: this.chainConfig.rpcUrl } });
    }
    return this._network;
  }

  async getSTXBalance(address: string): Promise<bigint> {
    const network = await this.getNetwork();
    const url = `${network.client.baseUrl}/extended/v1/address/${address}/balances`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching STX balance: ${response.statusText}`);
    }
    const data = await response.json();
    return BigInt(data.stx.balance);
  }

  async readTokenBalance(token: string, address: string): Promise<bigint> {
    const { Cl, parseContractId, fetchCallReadOnlyFunction } = await loadStacksTransactions();
    const network = await this.getNetwork();
    const [contractAddress, contractName] = parseContractId(token as ContractIdString);
    const result = (await fetchCallReadOnlyFunction({
      contractAddress: contractAddress as string,
      contractName: contractName as string,
      functionName: 'get-balance',
      functionArgs: [Cl.principal(address)],
      network,
      senderAddress: address,
    })) as { value: UIntCV };
    return result.value.value as bigint;
  }

  async getImplContractAddress(stateContract: string): Promise<string> {
    const { parseContractId } = await loadStacksTransactions();
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
    const { fetchCallReadOnlyFunction } = await loadStacksTransactions();
    const network = await this.getNetwork();
    return fetchCallReadOnlyFunction({
      contractAddress: txParams.contractAddress,
      contractName: txParams.contractName,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      network,
      senderAddress: await this.walletProvider.getWalletAddress(),
    });
  }
}
