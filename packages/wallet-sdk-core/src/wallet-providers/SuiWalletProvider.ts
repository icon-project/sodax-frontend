import { bcs } from '@mysten/sui/bcs';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { Transaction, TransactionArgument } from '@mysten/sui/transactions';
import { toHex } from 'viem';
import type { Hex } from '@sodax/types';
import type { ISuiWalletProvider, SuiTransaction, SuiExecutionResult, SuiPaginatedCoins } from '@sodax/types';
import { signTransaction } from '@mysten/wallet-standard';

// Private key wallet config
export type SuiPkWalletConfig = {
  rpcUrl: string;
  mnemonics: string;
};

// Browser extension wallet config
export type SuiBrowserExtensionWalletConfig = {
  client: SuiClient;
  wallet: any;
  account: any;
};

// Unified config type
export type SuiWalletConfig = SuiPkWalletConfig | SuiBrowserExtensionWalletConfig;

// Type guards
function isPkWalletConfig(walletConfig: SuiWalletConfig): walletConfig is SuiPkWalletConfig {
  return 'mnemonics' in walletConfig;
}

function isBrowserExtensionWalletConfig(
  walletConfig: SuiWalletConfig,
): walletConfig is SuiBrowserExtensionWalletConfig {
  return 'wallet' in walletConfig && 'account' in walletConfig;
}

export class SuiWalletProvider implements ISuiWalletProvider {
  private client: SuiClient;
  private wallet: any;
  private account: any;
  private keyPair: Ed25519Keypair | undefined;
  private isPkMode: boolean;

  constructor(walletConfig: SuiWalletConfig) {
    if (isPkWalletConfig(walletConfig)) {
      this.client = new SuiClient({ url: walletConfig.rpcUrl });
      this.keyPair = Ed25519Keypair.deriveKeypair(walletConfig.mnemonics);
      this.isPkMode = true;
    } else if (isBrowserExtensionWalletConfig(walletConfig)) {
      this.client = walletConfig.client;
      this.wallet = walletConfig.wallet;
      this.account = walletConfig.account;
      this.isPkMode = false;
    } else {
      throw new Error('Invalid wallet configuration');
    }
  }

  async signAndExecuteTxn(txn: SuiTransaction): Promise<string> {
    if (this.isPkMode && this.keyPair) {
      const res = await this.client.signAndExecuteTransaction({
        transaction: txn as unknown as Transaction,
        signer: this.keyPair,
      });
      return res.digest;
    }

    const browserWallet = this.wallet;
    const browserAccount = this.account;
    if (browserAccount.chains.length === 0) {
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

    const sender =
      this.isPkMode && this.keyPair ? this.keyPair.getPublicKey().toSuiAddress() : (this.account as any).address;

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

  async getWalletAddress(): Promise<string> {
    if (this.isPkMode && this.keyPair) {
      return this.keyPair.toSuiAddress();
    }

    const browserAccount = this.account as any;
    return browserAccount.address;
  }

  async getWalletAddressBytes(): Promise<Hex> {
    const walletAddress = await this.getWalletAddress();
    return toHex(bcs.Address.serialize(walletAddress).toBytes());
  }
}
