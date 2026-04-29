import { networkFrom, type StacksNetwork } from '@stacks/network';
import {
  broadcastTransaction,
  fetchCallReadOnlyFunction,
  getAddressFromPrivateKey,
  makeContractCall,
  PostConditionMode,
  privateKeyToPublic,
  publicKeyToHex,
  type ClarityValue,
  type PostConditionModeName,
} from '@stacks/transactions';
import { request } from '@stacks/connect';
import type { IStacksWalletProvider, StacksTransactionParams } from '@sodax/types';
import { BaseWalletProvider } from '../BaseWalletProvider.js';
import type {
  BrowserExtensionStacksWalletConfig,
  PrivateKeyStacksWalletConfig,
  StacksBrowserExtensionWallet,
  StacksPkWallet,
  StacksWallet,
  StacksWalletConfig,
  StacksWalletDefaults,
} from './types.js';

export function isPrivateKeyStacksWalletConfig(config: StacksWalletConfig): config is PrivateKeyStacksWalletConfig {
  return 'privateKey' in config;
}

export function isBrowserExtensionStacksWalletConfig(
  config: StacksWalletConfig,
): config is BrowserExtensionStacksWalletConfig {
  return 'address' in config;
}

function isStacksPkWallet(wallet: StacksWallet): wallet is StacksPkWallet {
  return wallet.type === 'PRIVATE_KEY';
}

function toPostConditionModeName(mode?: PostConditionMode): PostConditionModeName | undefined {
  if (mode === undefined) return undefined;
  return mode === PostConditionMode.Allow ? 'allow' : 'deny';
}

function resolveNetwork(selector: StacksWalletDefaults['network'], endpoint: string | undefined): StacksNetwork {
  if (typeof selector === 'object' && selector !== null) return selector;
  const base = networkFrom(selector ?? 'mainnet');
  return endpoint ? { ...base, client: { ...base.client, baseUrl: endpoint } } : base;
}

export class StacksWalletProvider extends BaseWalletProvider<StacksWalletDefaults> implements IStacksWalletProvider {
  public readonly chainType = 'STACKS' as const;
  private readonly network: StacksNetwork;
  private readonly wallet: StacksWallet;

  constructor(config: StacksWalletConfig) {
    super(config.defaults);
    this.network = resolveNetwork(this.defaults.network, config.endpoint);

    if (isPrivateKeyStacksWalletConfig(config)) {
      this.wallet = { type: 'PRIVATE_KEY', privateKey: config.privateKey };
      return;
    }

    if (isBrowserExtensionStacksWalletConfig(config)) {
      this.wallet = { type: 'BROWSER_EXTENSION', address: config.address, provider: config.provider };
      return;
    }

    throw new Error('Invalid Stacks wallet configuration');
  }

  async sendTransaction(
    txParams: StacksTransactionParams,
    options?: Pick<StacksWalletDefaults, 'postConditionMode'>,
  ): Promise<string> {
    const postConditionMode =
      txParams.postConditionMode ?? options?.postConditionMode ?? this.defaults.postConditionMode;
    const finalParams = { ...txParams, postConditionMode };

    if (isStacksPkWallet(this.wallet)) {
      return this.sendTransactionWithPrivateKey(finalParams);
    }
    return this.sendTransactionWithAdapter(finalParams);
  }

  private async sendTransactionWithPrivateKey(txParams: StacksTransactionParams): Promise<string> {
    const transaction = await makeContractCall({
      contractAddress: txParams.contractAddress,
      contractName: txParams.contractName,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      senderKey: (this.wallet as StacksPkWallet).privateKey,
      network: this.network,
      postConditionMode: txParams.postConditionMode,
      postConditions: txParams.postConditions,
    });

    const result = await broadcastTransaction({ network: this.network, transaction });
    return result.txid;
  }

  private async sendTransactionWithAdapter(txParams: StacksTransactionParams): Promise<string> {
    const browserWallet = this.wallet as StacksBrowserExtensionWallet;
    const contract = `${txParams.contractAddress}.${txParams.contractName}` as `${string}.${string}`;
    const networkName = this.networkName();

    const params = {
      contract,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      network: networkName,
      postConditions: txParams.postConditions,
      postConditionMode: toPostConditionModeName(txParams.postConditionMode),
    };

    const result = browserWallet.provider
      ? await request({ provider: browserWallet.provider }, 'stx_callContract', params)
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
      senderAddress: await this.getWalletAddress(),
    });
  }

  async getWalletAddress(): Promise<string> {
    if (isStacksPkWallet(this.wallet)) {
      return getAddressFromPrivateKey(this.wallet.privateKey, this.network);
    }
    return this.wallet.address;
  }

  async getPublicKey(): Promise<string> {
    if (isStacksPkWallet(this.wallet)) {
      return publicKeyToHex(privateKeyToPublic(this.wallet.privateKey));
    }
    throw new Error('getPublicKey is only supported for private key wallet configuration');
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

  private networkName(): 'mainnet' | 'testnet' {
    return this.defaults.network === 'testnet' ? 'testnet' : 'mainnet';
  }
}
