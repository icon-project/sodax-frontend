import type {
  IAleoWalletProvider,
  AleoExecuteOptions,
  AleoExecutionResult,
  AleoTransactionReceipt,
  AleoWaitForReceiptOptions,
  AleoNetworkEnv,
} from '@sodax/types';

import type {
  Account as ProvableAccount,
  TransactionOptions as ProvableTransactionOptions,
} from '@provablehq/aleo-types';

import type { WalletAdapter } from '@provablehq/aleo-wallet-standard';

// Lazy-load @provablehq/sdk to avoid pulling 43MB WASM into the webpack bundle graph at import time.
// The WASM module uses top-level await which breaks SSR and causes OOM during Next.js builds.
// The SDK default export resolves to testnet — we must import the network-specific build.
type AleoSDK = typeof import('@provablehq/sdk');

function loadAleoSDK(network: AleoNetworkEnv): Promise<AleoSDK> {
  // Both builds export the same API surface — the cast is safe.
  if (network === 'testnet') return import('@provablehq/sdk/testnet.js') as unknown as Promise<AleoSDK>;
  return import('@provablehq/sdk/mainnet.js') as unknown as Promise<AleoSDK>;
}

/** Priority fee for private key wallets — 0 means only the base fee (calculated by ProgramManager) */
const DEFAULT_PK_PRIORITY_FEE = 0;
/** Minimum fee for browser extension wallets — 0.001 ALEO to ensure transaction acceptance */
const DEFAULT_BROWSER_FEE = 0.001;


export type DelegateProvingConfig = {
  apiKey: string;
  consumerId: string;
  url?: string;
};

export type PrivateKeyAleoWalletConfig = {
  type: 'privateKey';
  rpcUrl: string;
  privateKey: string;
  network: AleoNetworkEnv;
  delegate: DelegateProvingConfig;
};

export type BrowserExtensionAleoWalletConfig = {
  type: 'browserExtension';
  rpcUrl: string;
  provableAdapter: WalletAdapter;
  network?: AleoNetworkEnv;
};

export type AleoWalletConfig = PrivateKeyAleoWalletConfig | BrowserExtensionAleoWalletConfig;

export type PkAleoWallet = {
  type: 'privateKey';
  account: InstanceType<Awaited<AleoSDK>['Account']>;
};

export type BrowserExtensionAleoWallet = {
  type: 'browserExtension';
  adapter: WalletAdapter;
  connectedAccount: ProvableAccount | null;
};

export type AleoWallet = PkAleoWallet | BrowserExtensionAleoWallet;

export function isPrivateKeyConfig(config: AleoWalletConfig): config is PrivateKeyAleoWalletConfig {
  return config.type === 'privateKey';
}

export function isBrowserExtensionConfig(config: AleoWalletConfig): config is BrowserExtensionAleoWalletConfig {
  return config.type === 'browserExtension';
}

export function isPkAleoWallet(wallet: AleoWallet): wallet is PkAleoWallet {
  return wallet.type === 'privateKey';
}

export function isBrowserExtensionAleoWallet(wallet: AleoWallet): wallet is BrowserExtensionAleoWallet {
  return wallet.type === 'browserExtension';
}

// Internal state created lazily when the SDK finishes loading
type InitializedState = {
  networkClient: InstanceType<Awaited<AleoSDK>['AleoNetworkClient']>;
  wallet: AleoWallet;
  programManager: InstanceType<Awaited<AleoSDK>['ProgramManager']>;
};

export class AleoWalletProvider implements IAleoWalletProvider {
  private readonly config: AleoWalletConfig;
  private initPromise: Promise<InitializedState> | null = null;
  private state: InitializedState | null = null;

  constructor(config: AleoWalletConfig) {
    if (!isPrivateKeyConfig(config) && !isBrowserExtensionConfig(config)) {
      throw new Error('Invalid wallet configuration');
    }
    this.config = config;
  }

  /** Lazily loads the SDK and initialises networkClient / wallet / programManager on first call. */
  private async ensureInitialized(): Promise<InitializedState> {
    if (this.state) return this.state;

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    this.state = await this.initPromise;
    return this.state;
  }

  private async initialize(): Promise<InitializedState> {
    const network = isPrivateKeyConfig(this.config) ? this.config.network : (this.config.network ?? 'mainnet');
    const { Account, AleoNetworkClient, ProgramManager, AleoKeyProvider, NetworkRecordProvider } =
      await loadAleoSDK(network);

    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);

    if (isPrivateKeyConfig(this.config)) {
      const networkClient = new AleoNetworkClient(this.config.rpcUrl);
      const account = new Account({ privateKey: this.config.privateKey });
      const wallet: PkAleoWallet = { type: 'privateKey', account };
      const recordProvider = new NetworkRecordProvider(account, networkClient);
      const programManager = new ProgramManager(this.config.rpcUrl, keyProvider, recordProvider);
      programManager.setAccount(account);

      return { networkClient, wallet, programManager };
    }

    const browserConfig = this.config as BrowserExtensionAleoWalletConfig;
    const networkClient = new AleoNetworkClient(browserConfig.rpcUrl);
    const wallet: BrowserExtensionAleoWallet = {
      type: 'browserExtension',
      adapter: browserConfig.provableAdapter,
      connectedAccount: null,
    };
    const programManager = new ProgramManager(
      browserConfig.rpcUrl,
      keyProvider,
      undefined, // No record provider for browser wallets
    );

    return { networkClient, wallet, programManager };
  }

  async executeAndWait(
    options: AleoExecuteOptions,
    receiptOptions?: AleoWaitForReceiptOptions,
  ): Promise<{ result: AleoExecutionResult; receipt: AleoTransactionReceipt }> {
    const result = await this.execute(options);
    const receipt = await this.waitForTransactionReceipt(result.transactionId, receiptOptions);

    return { result, receipt };
  }

  async getWalletAddress(): Promise<string> {
    const { wallet } = await this.ensureInitialized();

    if (isPkAleoWallet(wallet)) {
      return wallet.account.address().to_string();
    }

    if (isBrowserExtensionAleoWallet(wallet)) {
      if (!wallet.adapter.connected || !wallet.adapter.account) {
        throw new Error('Browser wallet not connected');
      }
      return wallet.adapter.account.address;
    }

    throw new Error('Invalid wallet configuration');
  }

  private getDefaultDelegateUrl(): string {
    const network = isPrivateKeyConfig(this.config) ? this.config.network : undefined;
    return network === 'testnet'
      ? 'https://api.provable.com/prove/testnet'
      : 'https://api.provable.com/prove/mainnet';
  }

  async execute(options: AleoExecuteOptions): Promise<AleoExecutionResult> {
    const { wallet, programManager } = await this.ensureInitialized();
    const { programName, functionName, inputs, priorityFee, privateFee = false } = options;
    const delegateConfig = isPrivateKeyConfig(this.config) ? this.config.delegate : undefined;

    if (isPkAleoWallet(wallet)) {
      try {
        if (delegateConfig) {
          const provingRequest = await programManager.provingRequest({
            programName,
            functionName,
            inputs,
            priorityFee: priorityFee ?? DEFAULT_PK_PRIORITY_FEE,
            privateFee,
            broadcast: true,
          });

          const provingResponse = await programManager.networkClient.submitProvingRequest({
            provingRequest,
            url: delegateConfig.url ?? this.getDefaultDelegateUrl(),
            apiKey: delegateConfig.apiKey,
            consumerId: delegateConfig.consumerId,
            dpsPrivacy: true,
          });
          return {
            transactionId: provingResponse.transaction.id,
          };
        }

        const txId = await programManager.execute({
          programName,
          functionName,
          priorityFee: priorityFee ?? DEFAULT_PK_PRIORITY_FEE,
          privateFee,
          inputs,
        });
        return {
          transactionId: txId,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
      }
    }

    if (isBrowserExtensionAleoWallet(wallet)) {
      if (!wallet.adapter.connected || !wallet.adapter.account) {
        throw new Error('Browser wallet not connected');
      }

      try {
        const provableOptions: ProvableTransactionOptions = {
          program: programName,
          function: functionName,
          inputs,
          fee: priorityFee ?? DEFAULT_BROWSER_FEE,
          privateFee: privateFee || false,
        };

        const result = await wallet.adapter.executeTransaction(provableOptions);

        if (!result?.transactionId) {
          throw new Error('No transaction ID returned from browser wallet');
        }

        return {
          transactionId: result.transactionId,
          outputs: undefined,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Browser wallet execution failed');
      }
    }

    throw new Error('Invalid wallet configuration');
  }

  async waitForTransactionReceipt(
    transactionId: string,
    options: AleoWaitForReceiptOptions = {},
  ): Promise<AleoTransactionReceipt> {
    const { networkClient } = await this.ensureInitialized();
    const { checkInterval = 2000, timeout = 45000 } = options;

    try {
      const confirmedTx = await networkClient.waitForTransactionConfirmation(
        transactionId,
        checkInterval,
        timeout,
      );

      return {
        transactionId,
        status: confirmedTx.status as AleoTransactionReceipt['status'],
        type: confirmedTx.type,
        index: confirmedTx.index,
        transaction: confirmedTx.transaction as unknown,
        finalize: confirmedTx.finalize as unknown[],
        confirmedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('did not appear')) {
          throw new Error(
            `Transaction ${transactionId} did not confirm within ${timeout}ms. The transaction may still be pending - check the transaction status manually.`,
          );
        }
        if (error.message.includes('Malformed') || error.message.includes('Invalid URL')) {
          throw new Error(
            `Invalid transaction ID format: ${transactionId}.Please verify the transaction ID is correct.`,
          );
        }
        if (error.message.includes('rejected')) {
          throw new Error(
            `Transaction ${transactionId} was rejected by the network.Check that the fee payer has sufficient credits and inputs are valid.`,
          );
        }
      }

      throw error;
    }
  }
}
