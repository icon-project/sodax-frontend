import { Account } from '@near-js/accounts';
import { JsonRpcProvider } from '@near-js/providers';
import { KeyPairSigner } from '@near-js/signers';
import type { KeyPairString } from '@near-js/crypto';
import { actionCreators } from '@near-js/transactions';
import { toHex } from 'viem';
import type { Hex, INearWalletProvider, CallContractParams, NearRawTransaction } from '@sodax/types';
import type { NearConnector } from '@hot-labs/near-connect';

/**
 * Near Wallet Configuration Types
 */

export type PrivateKeyNearWalletConfig = {
  rpcUrl: string;
  accountId: string;
  privateKey: string;
};

export type BrowserExtensionNearWalletConfig = {
  wallet: NearConnector;
};

export type NearWalletConfig = PrivateKeyNearWalletConfig | BrowserExtensionNearWalletConfig;

/**
 * Near Type Guards
 */

export function isPrivateKeyNearWalletConfig(config: NearWalletConfig): config is PrivateKeyNearWalletConfig {
  return 'rpcUrl' in config && 'accountId' in config && 'privateKey' in config;
}

export function isBrowserExtensionNearWalletConfig(
  config: NearWalletConfig,
): config is BrowserExtensionNearWalletConfig {
  return 'wallet' in config;
}

/**
 * NearWalletProvider implements INearWalletProvider
 * Supports both private key and browser extension wallet configurations
 */
export class NearWalletProvider implements INearWalletProvider {
  public readonly account?: Account;
  public readonly rpcProvider?: JsonRpcProvider;
  private readonly wallet?: NearConnector;

  constructor(config: NearWalletConfig) {
    if (isPrivateKeyNearWalletConfig(config)) {
      this.rpcProvider = new JsonRpcProvider({ url: config.rpcUrl });
      const signer = KeyPairSigner.fromSecretKey(config.privateKey as KeyPairString);
      this.account = new Account(config.accountId, this.rpcProvider, signer);
    } else if (isBrowserExtensionNearWalletConfig(config)) {
      this.wallet = config.wallet;
    } else {
      throw new Error('Invalid Near wallet config');
    }
  }

  async getWalletAddress(): Promise<string> {
    if (this.account) {
      return this.account.accountId;
    }
    if (this.wallet) {
      const connectedWallet = await this.wallet.getConnectedWallet();
      if (!connectedWallet) {
        throw new Error('No wallet connected');
      }
      const accounts = connectedWallet.accounts;
      if (accounts.length === 0 || accounts[0] === undefined) {
        throw new Error('No accounts found in wallet');
      }
      return accounts[0].accountId;
    }
    throw new Error('Wallet not initialized');
  }

  async getWalletAddressBytes(): Promise<Hex> {
    const address = await this.getWalletAddress();
    return toHex(Buffer.from(address, 'utf-8'));
  }

  async getRawTransaction(params: CallContractParams): Promise<NearRawTransaction> {
    const signerId = await this.getWalletAddress();

    return {
      signerId,
      params,
    } satisfies NearRawTransaction;
  }

  async signAndSubmitTxn(transaction: NearRawTransaction): Promise<string> {
    if (this.account) {
      const publicKey = await this.account.getSigner()?.getPublicKey();

      if (!publicKey) {
        throw new Error('Signer not found');
      }

      const nearTx = await this.account.createTransaction(
        transaction.params.contractId,
        [
          actionCreators.functionCall(
            transaction.params.method,
            transaction.params.args,
            transaction.params.gas,
            transaction.params.deposit,
          ),
        ],
        publicKey,
      );

      const res = await this.account.signAndSendTransaction({
        ...nearTx,
        throwOnFailure: true,
        waitUntil: 'FINAL',
      });
      return res.transaction_outcome.id;
    }

    if (this.wallet) {
      const signerId = await this.getWalletAddress();
      const connectedWallet = await this.wallet.getConnectedWallet();

      if (!connectedWallet) {
        throw new Error('No wallet connected');
      }

      const res = await connectedWallet.wallet.signAndSendTransaction({
        signerId,
        receiverId: transaction.params.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: transaction.params.method,
              args: transaction.params.args as unknown as Record<string, unknown>,
              gas: transaction.params.gas?.toString() ?? '0',
              deposit: transaction.params.deposit?.toString() ?? '0',
            },
          },
        ],
      });
      return res.transaction_outcome.id;
    }

    throw new Error('Wallet not initialized');
  }
}
