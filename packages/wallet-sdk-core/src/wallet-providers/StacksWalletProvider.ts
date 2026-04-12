import { networkFrom, type StacksNetwork } from '@stacks/network';

import {
  broadcastTransaction,
  fetchCallReadOnlyFunction,
  getAddressFromPrivateKey,
  makeContractCall,
  PostConditionMode,
  type ClarityValue,
  type PostConditionModeName,
} from '@stacks/transactions';
import type { StacksProvider } from '@stacks/connect';

import type { IStacksWalletProvider, StacksTransactionParams } from '@sodax/types';

/**
 * Lazy-load @stacks/connect to avoid Turbopack scope-hoisting cycle (#1070).
 * Cannot bundle via noExternal because transitive deps (@reown/appkit → node-fetch) crash at SSR runtime.
 */
let stacksConnectPromise: Promise<typeof import('@stacks/connect')> | undefined;
function getStacksConnect() {
  if (!stacksConnectPromise) {
    stacksConnectPromise = import('@stacks/connect');
  }
  return stacksConnectPromise;
}

// Private key wallet config
export type PrivateKeyStacksWalletConfig = {
  privateKey: string;
  endpoint?: string;
};

// Browser extension wallet config
export type BrowserExtensionStacksWalletConfig = {
  address: string;
  endpoint?: string;
  provider?: StacksProvider;
};

// Unified config type
export type StacksWalletConfig = PrivateKeyStacksWalletConfig | BrowserExtensionStacksWalletConfig;

// Type guards
export function isPrivateKeyStacksWalletConfig(config: StacksWalletConfig): config is PrivateKeyStacksWalletConfig {
  return 'privateKey' in config;
}

export function isBrowserExtensionStacksWalletConfig(
  config: StacksWalletConfig,
): config is BrowserExtensionStacksWalletConfig {
  return 'address' in config;
}

// Internal wallet types
type StacksPkWallet = {
  type: 'PRIVATE_KEY';
  privateKey: string;
};

type StacksBrowserExtensionWallet = {
  type: 'BROWSER_EXTENSION';
  address: string;
  provider?: StacksProvider;
};

type StacksWallet = StacksPkWallet | StacksBrowserExtensionWallet;

function isStacksPkWallet(wallet: StacksWallet): wallet is StacksPkWallet {
  return wallet.type === 'PRIVATE_KEY';
}

function toPostConditionModeName(mode?: PostConditionMode): PostConditionModeName | undefined {
  if (mode === undefined) return undefined;
  return mode === PostConditionMode.Allow ? 'allow' : 'deny';
}

export class StacksWalletProvider implements IStacksWalletProvider {
  private readonly network: StacksNetwork;
  private readonly wallet: StacksWallet;

  constructor(config: StacksWalletConfig) {
    const mainnet = networkFrom('mainnet');
    this.network = config.endpoint ? { ...mainnet, client: { ...mainnet.client, baseUrl: config.endpoint } } : mainnet;

    if (isPrivateKeyStacksWalletConfig(config)) {
      this.wallet = { type: 'PRIVATE_KEY', privateKey: config.privateKey };
    } else if (isBrowserExtensionStacksWalletConfig(config)) {
      this.wallet = { type: 'BROWSER_EXTENSION', address: config.address, provider: config.provider };
    } else {
      throw new Error('Invalid Stacks wallet configuration');
    }
  }

  async sendTransaction(txParams: StacksTransactionParams): Promise<string> {
    if (isStacksPkWallet(this.wallet)) {
      return this.sendTransactionWithPrivateKey(txParams);
    }
    return this.sendTransactionWithAdapter(txParams);
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

    const result = await broadcastTransaction({
      network: this.network,
      transaction,
    });

    return result.txid;
  }

  private async sendTransactionWithAdapter(txParams: StacksTransactionParams): Promise<string> {
    const { request } = await getStacksConnect();
    const browserWallet = this.wallet as StacksBrowserExtensionWallet;
    const contract = `${txParams.contractAddress}.${txParams.contractName}` as `${string}.${string}`;

    const params = {
      contract,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      network: 'mainnet',
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
}
