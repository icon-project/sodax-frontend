import { SuiClient } from '@mysten/sui/client';
import type { SuiTransactionBlockResponseOptions } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import type { TransactionArgument } from '@mysten/sui/transactions';
import type { ISuiWalletProvider, SuiTransaction, SuiExecutionResult, SuiPaginatedCoins } from '@sodax/types';
import {
  signTransaction,
  type SuiWalletFeatures,
  type WalletAccount,
  type WalletWithFeatures,
} from '@mysten/wallet-standard';
import { BaseWalletProvider } from './BaseWalletProvider.js';

const DEFAULT_DRY_RUN_ENABLED = true;
const DEFAULT_GET_COINS_LIMIT = 10;
const DEFAULT_PK_RESPONSE_OPTIONS: SuiTransactionBlockResponseOptions = { showEffects: true };
const DEFAULT_BROWSER_RESPONSE_OPTIONS: SuiTransactionBlockResponseOptions = {
  showEffects: true,
  showRawEffects: true,
};

/**
 * signAndExecuteTxn behavior. Pre-flight dry-run is enabled by default — disable only when
 * paying gas for a doomed tx is acceptable. `response` options forward to the underlying
 * SuiClient call (signAndExecuteTransaction in PK mode, executeTransactionBlock in browser-ext).
 */
export type SuiSignAndExecutePolicy = {
  dryRun?: { enabled?: boolean };
  response?: SuiTransactionBlockResponseOptions;
};

/** getCoins pagination policy. */
export type SuiGetCoinsPolicy = {
  limit?: number;
};

/** Defaults applied to every call. Per-call options shallow-merge over these. */
export type SuiWalletDefaults = {
  signAndExecuteTxn?: SuiSignAndExecutePolicy;
  getCoins?: SuiGetCoinsPolicy;
};

export type PrivateKeySuiWalletConfig = {
  rpcUrl: string;
  mnemonics: string;
  defaults?: SuiWalletDefaults;
};

export type BrowserExtensionSuiWalletConfig = {
  client: SuiClient;
  wallet: WalletWithFeatures<Partial<SuiWalletFeatures>>;
  account: WalletAccount;
  defaults?: SuiWalletDefaults;
};

export type SuiWalletConfig = PrivateKeySuiWalletConfig | BrowserExtensionSuiWalletConfig;

function isPrivateKeySuiWalletConfig(walletConfig: SuiWalletConfig): walletConfig is PrivateKeySuiWalletConfig {
  return 'mnemonics' in walletConfig;
}

function isBrowserExtensionSuiWalletConfig(
  walletConfig: SuiWalletConfig,
): walletConfig is BrowserExtensionSuiWalletConfig {
  return 'wallet' in walletConfig && 'account' in walletConfig;
}

export type PkSuiWallet = {
  keyPair: Ed25519Keypair;
};

export type BrowserExtensionSuiWallet = {
  wallet: WalletWithFeatures<Partial<SuiWalletFeatures>>;
  account: WalletAccount;
};

export type SuiWallet = PkSuiWallet | BrowserExtensionSuiWallet;

export function isPkSuiWallet(wallet: SuiWallet): wallet is PkSuiWallet {
  return 'keyPair' in wallet;
}

export function isBrowserExtensionSuiWallet(wallet: SuiWallet): wallet is BrowserExtensionSuiWallet {
  return 'wallet' in wallet && 'account' in wallet;
}

export function isSuiWallet(wallet: SuiWallet): wallet is SuiWallet {
  return isPkSuiWallet(wallet) || isBrowserExtensionSuiWallet(wallet);
}

/**
 * Bridge the deliberately-narrow SuiTransaction interface (which only guarantees `toJSON()`)
 * to a concrete Transaction instance. Returns the input directly when it's already a
 * Transaction; otherwise rebuilds via Transaction.from(json).
 */
async function toMystenTransaction(txn: SuiTransaction): Promise<Transaction> {
  if (txn instanceof Transaction) return txn;
  return Transaction.from(await txn.toJSON());
}

export class SuiWalletProvider extends BaseWalletProvider<SuiWalletDefaults> implements ISuiWalletProvider {
  public readonly chainType = 'SUI' as const;
  private readonly client: SuiClient;
  private readonly wallet: SuiWallet;

  constructor(walletConfig: SuiWalletConfig) {
    super(walletConfig.defaults);

    if (isPrivateKeySuiWalletConfig(walletConfig)) {
      this.client = new SuiClient({ url: walletConfig.rpcUrl });
      this.wallet = { keyPair: Ed25519Keypair.deriveKeypair(walletConfig.mnemonics) };
      return;
    }

    if (isBrowserExtensionSuiWalletConfig(walletConfig)) {
      this.client = walletConfig.client;
      this.wallet = { wallet: walletConfig.wallet, account: walletConfig.account };
      return;
    }

    throw new Error('Invalid wallet configuration');
  }

  async getWalletAddress(): Promise<string> {
    return this.getSuiAddress();
  }

  async signAndExecuteTxn(txn: SuiTransaction, options?: SuiSignAndExecutePolicy): Promise<string> {
    const policy = this.mergePolicy('signAndExecuteTxn', options);
    const dryRunEnabled = policy.dryRun?.enabled ?? DEFAULT_DRY_RUN_ENABLED;

    const sender = this.getSuiAddress();
    const tx = await toMystenTransaction(txn);
    const transactionBlock = dryRunEnabled
      ? await this.buildAndDryRunOrThrow(tx, sender)
      : await this.buildOnly(tx, sender);

    if (isPkSuiWallet(this.wallet)) {
      const res = await this.client.signAndExecuteTransaction({
        transaction: transactionBlock,
        signer: this.wallet.keyPair,
        options: { ...DEFAULT_PK_RESPONSE_OPTIONS, ...policy.response },
      });
      this.assertEffectsSuccess(res.digest, res.effects?.status);
      return res.digest;
    }

    if (isBrowserExtensionSuiWallet(this.wallet)) {
      const browserWallet = this.wallet.wallet;
      const browserAccount = this.wallet.account;

      if (!browserAccount || browserAccount.chains.length === 0) {
        throw new Error('No chains available for wallet account');
      }
      const chain = browserAccount.chains[0];
      if (!chain) {
        throw new Error('No chain available for wallet account');
      }
      const { bytes, signature } = await signTransaction(browserWallet, {
        transaction: txn,
        account: browserAccount,
        chain,
      });

      const res = await this.client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { ...DEFAULT_BROWSER_RESPONSE_OPTIONS, ...policy.response },
      });
      this.assertEffectsSuccess(res.digest, res.effects?.status);
      return res.digest;
    }

    throw new Error('Invalid wallet configuration');
  }

  async viewContract(
    tx: Transaction,
    packageId: string,
    module: string,
    functionName: string,
    args: unknown[],
    typeArgs: string[] = [],
  ): Promise<SuiExecutionResult> {
    tx.moveCall({
      target: `${packageId}::${module}::${functionName}`,
      arguments: args as TransactionArgument[],
      typeArguments: typeArgs,
    });

    const sender = this.getSuiAddress();
    const txResults = await this.client.devInspectTransactionBlock({ transactionBlock: tx, sender });

    if (txResults.results && txResults.results[0] !== undefined) {
      return txResults.results[0] as SuiExecutionResult;
    }
    throw Error(`transaction didn't return any values: ${JSON.stringify(txResults, null, 2)}`);
  }

  async getCoins(address: string, token: string, options?: SuiGetCoinsPolicy): Promise<SuiPaginatedCoins> {
    const policy = this.mergePolicy('getCoins', options);
    const limit = policy.limit ?? DEFAULT_GET_COINS_LIMIT;
    return this.client.getCoins({ owner: address, coinType: token, limit });
  }

  private async buildAndDryRunOrThrow(tx: Transaction, sender: string): Promise<Uint8Array> {
    tx.setSenderIfNotSet(sender);
    const transactionBlock = await tx.build({ client: this.client });
    const result = await this.client.dryRunTransactionBlock({ transactionBlock });
    if (result.effects.status.status === 'failure') {
      throw new Error(`Sui transaction pre-flight failed: ${result.effects.status.error ?? 'unknown'}`);
    }
    return transactionBlock;
  }

  private async buildOnly(tx: Transaction, sender: string): Promise<Uint8Array> {
    tx.setSenderIfNotSet(sender);
    return tx.build({ client: this.client });
  }

  private assertEffectsSuccess(
    digest: string,
    status: { status?: 'success' | 'failure'; error?: string | null } | undefined,
  ): void {
    if (status?.status === 'failure') {
      throw new Error(`Sui transaction failed on-chain: ${status.error ?? 'unknown'} (digest=${digest})`);
    }
  }

  private getSuiAddress(): string {
    if (isPkSuiWallet(this.wallet)) return this.wallet.keyPair.toSuiAddress();
    if (isBrowserExtensionSuiWallet(this.wallet)) return this.wallet.account.address;
    throw new Error('Invalid wallet configuration');
  }
}
