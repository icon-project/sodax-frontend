import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { Transaction, TransactionArgument } from '@mysten/sui/transactions';
import type { ISuiWalletProvider, SuiTransaction, SuiExecutionResult, SuiPaginatedCoins } from '@sodax/types';
import {
  signTransaction,
  type SuiWalletFeatures,
  type WalletAccount,
  type WalletWithFeatures,
} from '@mysten/wallet-standard';

// Private key wallet config
export type PrivateKeySuiWalletConfig = {
  rpcUrl: string;
  mnemonics: string;
};

// Browser extension wallet config
export type BrowserExtensionSuiWalletConfig = {
  client: SuiClient;
  wallet: WalletWithFeatures<Partial<SuiWalletFeatures>>;
  account: WalletAccount;
};

// Unified config type
export type SuiWalletConfig = PrivateKeySuiWalletConfig | BrowserExtensionSuiWalletConfig;

// Type guards
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

export class SuiWalletProvider implements ISuiWalletProvider {
  private readonly client: SuiClient;
  private readonly wallet: SuiWallet;

  constructor(walletConfig: SuiWalletConfig) {
    if (isPrivateKeySuiWalletConfig(walletConfig)) {
      this.client = new SuiClient({ url: walletConfig.rpcUrl });
      this.wallet = {
        keyPair: Ed25519Keypair.deriveKeypair(walletConfig.mnemonics),
      };
    } else if (isBrowserExtensionSuiWalletConfig(walletConfig)) {
      this.client = walletConfig.client;
      this.wallet = {
        wallet: walletConfig.wallet,
        account: walletConfig.account,
      };
    } else {
      throw new Error('Invalid wallet configuration');
    }
  }

  async signAndExecuteTxn(txn: SuiTransaction): Promise<string> {
    if (isPkSuiWallet(this.wallet)) {
      const res = await this.client.signAndExecuteTransaction({
        transaction: txn as unknown as Transaction,
        signer: this.wallet.keyPair,
      });

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
        options: {
          showRawEffects: true,
        },
      });

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

    const txResults = await this.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender,
    });

    if (txResults.results && txResults.results[0] !== undefined) {
      return txResults.results[0] as SuiExecutionResult;
    }
    throw Error(`transaction didn't return any values: ${JSON.stringify(txResults, null, 2)}`);
  }

  async getCoins(address: string, token: string): Promise<SuiPaginatedCoins> {
    return this.client.getCoins({ owner: address, coinType: token, limit: 10 });
  }

  private getSuiAddress(): string {
    if (isPkSuiWallet(this.wallet)) {
      return this.wallet.keyPair.toSuiAddress();
    }
    if (isBrowserExtensionSuiWallet(this.wallet)) {
      return this.wallet.account.address;
    }
    throw new Error('Invalid wallet configuration');
  }

  async getWalletAddress(): Promise<string> {
    return this.getSuiAddress();
  }
}
