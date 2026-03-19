import {
  Account,
  AleoNetworkClient,
  ProgramManager,
  AleoKeyProvider,
  NetworkRecordProvider,
} from '@provablehq/sdk';

import type {
  IAleoWalletProvider,
  AleoExecuteOptions,
  AleoExecutionResult,
  AleoTransactionReceipt,
  AleoWaitForReceiptOptions,
} from '@sodax/types';

import type {
  Account as ProvableAccount,
  TransactionOptions as ProvableTransactionOptions,
} from '@provablehq/aleo-types';

import type { WalletAdapter } from '@provablehq/aleo-wallet-standard';

export type AleoNetwork = 'mainnet' | 'testnet';

export type DelegateProvingConfig = {
  apiKey: string;
  consumerId: string;
  url?: string;
};

export type PrivateKeyAleoWalletConfig = {
  type: 'privateKey';
  rpcUrl: string;
  privateKey: string;
  network: AleoNetwork;
  delegate: DelegateProvingConfig;
};

export type BrowserExtensionAleoWalletConfig = {
  type: 'browserExtension';
  rpcUrl: string;
  provableAdapter: WalletAdapter;
  network?: AleoNetwork;
};

export type AleoWalletConfig = PrivateKeyAleoWalletConfig | BrowserExtensionAleoWalletConfig;

export type PkAleoWallet = {
  type: 'privateKey';
  account: Account;
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

export class AleoWalletProvider implements IAleoWalletProvider {
  public readonly networkClient: AleoNetworkClient;
  public readonly wallet: AleoWallet;
  public readonly programManager: ProgramManager;
  private readonly keyProvider: AleoKeyProvider;
  private readonly delegateConfig?: DelegateProvingConfig;
  private readonly network?: AleoNetwork;

  constructor(config: AleoWalletConfig) {
    this.keyProvider = new AleoKeyProvider();
    this.keyProvider.useCache(true);

    if (isPrivateKeyConfig(config)) {
      this.network = config.network;
      this.delegateConfig = config.delegate;
      this.networkClient = new AleoNetworkClient(config.rpcUrl);
      const account = new Account({ privateKey: config.privateKey });

      this.wallet = { type: 'privateKey', account };

      const recordProvider = new NetworkRecordProvider(account, this.networkClient);

      this.programManager = new ProgramManager(config.rpcUrl, this.keyProvider, recordProvider);
      this.programManager.setAccount(account);
    } else if (isBrowserExtensionConfig(config)) {
      this.networkClient = new AleoNetworkClient(config.rpcUrl);

      this.wallet = {
        type: 'browserExtension',
        adapter: config.provableAdapter,
        connectedAccount: null,
      };

      this.programManager = new ProgramManager(
        config.rpcUrl,
        this.keyProvider,
        undefined, // No record provider for browser wallets
      );
    } else {
      throw new Error('Invalid wallet configuration');
    }
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
    if (isPkAleoWallet(this.wallet)) {
      return this.wallet.account.address().to_string();
    }

    if (isBrowserExtensionAleoWallet(this.wallet)) {
      if (!this.wallet.adapter.connected || !this.wallet.connectedAccount) {
        throw new Error('Browser wallet not connected');
      }
      return this.wallet.connectedAccount.address;
    }

    throw new Error('Invalid wallet configuration');
  }

  private getDefaultDelegateUrl(): string {
    return this.network === 'testnet'
      ? 'https://api.provable.com/prove/testnet'
      : 'https://api.provable.com/prove/mainnet';
  }

  async execute(options: AleoExecuteOptions): Promise<AleoExecutionResult> {
    const { programName, functionName, inputs, priorityFee = 0, privateFee = false } = options;

    if (isPkAleoWallet(this.wallet)) {
      try {
        if (this.delegateConfig) {
          const provingRequest = await this.programManager.provingRequest({
            programName,
            functionName,
            inputs,
            priorityFee,
            privateFee,
            broadcast: true,
          });

          const provingResponse = await this.programManager.networkClient.submitProvingRequest({
            provingRequest,
            url: this.delegateConfig.url ?? this.getDefaultDelegateUrl(),
            apiKey: this.delegateConfig.apiKey,
            consumerId: this.delegateConfig.consumerId,
            dpsPrivacy: true,
          });
          return {
            transactionId: provingResponse.transaction.id,
          };
        }

        const txId = await this.programManager.execute({
          programName,
          functionName,
          priorityFee,
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

    if (isBrowserExtensionAleoWallet(this.wallet)) {
      if (!this.wallet.adapter.connected || !this.wallet.connectedAccount) {
        throw new Error('Browser wallet not connected');
      }

      try {
        const provableOptions: ProvableTransactionOptions = {
          program: programName,
          function: functionName,
          inputs,
          fee: priorityFee || 0.001,
          privateFee: privateFee || false,
        };

        const result = await this.wallet.adapter.executeTransaction(provableOptions);

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
    const { checkInterval = 2000, timeout = 45000 } = options;

    try {
      const confirmedTx = await this.networkClient.waitForTransactionConfirmation(
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
