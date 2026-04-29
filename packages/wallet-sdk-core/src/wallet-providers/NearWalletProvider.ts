import { Account, JsonRpcProvider, KeyPairSigner, actions } from 'near-api-js';
import type { KeyPairString } from 'near-api-js';
import type { INearWalletProvider, CallContractParams, JsonObject, NearRawTransaction } from '@sodax/types';
import type { NearConnector } from '@hot-labs/near-connect';
import { BaseWalletProvider } from './BaseWalletProvider.js';

type NearTxExecutionStatus = 'NONE' | 'INCLUDED' | 'EXECUTED_OPTIMISTIC' | 'INCLUDED_FINAL' | 'EXECUTED' | 'FINAL';

const DEFAULT_THROW_ON_FAILURE = true;
const DEFAULT_WAIT_UNTIL: NearTxExecutionStatus = 'FINAL';

/** Defaults applied to every call. Per-call options shallow-merge over these. */
export type NearWalletDefaults = {
  /** Throw on failure flag for `signAndSendTransaction` (PK path). Default `true`. */
  throwOnFailure?: boolean;
  /** Wait-until status for confirmation. Default `'FINAL'`. */
  waitUntil?: NearTxExecutionStatus;
  /** Default gas if tx omits. */
  gasDefault?: bigint;
  /** Default deposit if tx omits. */
  depositDefault?: bigint;
};

/**
 * `JsonObject` from @sodax/types and `Record<string, unknown>` from near-api-js are
 * structurally compatible (both arbitrary string-keyed objects). This helper isolates
 * the type bridge in one place; runtime is identity (no copy, no validation).
 */
function jsonObjectToArgs(args: JsonObject): Record<string, unknown> {
  return args as Record<string, unknown>;
}

export type PrivateKeyNearWalletConfig = {
  rpcUrl: string;
  accountId: string;
  privateKey: string;
  defaults?: NearWalletDefaults;
};

export type BrowserExtensionNearWalletConfig = {
  wallet: NearConnector;
  defaults?: NearWalletDefaults;
};

export type NearWalletConfig = PrivateKeyNearWalletConfig | BrowserExtensionNearWalletConfig;

export function isPrivateKeyNearWalletConfig(config: NearWalletConfig): config is PrivateKeyNearWalletConfig {
  return 'rpcUrl' in config && 'accountId' in config && 'privateKey' in config;
}

export function isBrowserExtensionNearWalletConfig(
  config: NearWalletConfig,
): config is BrowserExtensionNearWalletConfig {
  return 'wallet' in config;
}

export class NearWalletProvider extends BaseWalletProvider<NearWalletDefaults> implements INearWalletProvider {
  public readonly chainType = 'NEAR' as const;
  public readonly account?: Account;
  public readonly rpcProvider?: JsonRpcProvider;
  private readonly wallet?: NearConnector;

  constructor(config: NearWalletConfig) {
    super(config.defaults);

    if (isPrivateKeyNearWalletConfig(config)) {
      this.rpcProvider = new JsonRpcProvider({ url: config.rpcUrl });
      const signer = KeyPairSigner.fromSecretKey(config.privateKey as KeyPairString);
      this.account = new Account(config.accountId, this.rpcProvider, signer);
      return;
    }

    if (isBrowserExtensionNearWalletConfig(config)) {
      this.wallet = config.wallet;
      return;
    }

    throw new Error('Invalid Near wallet config');
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

  async getRawTransaction(params: CallContractParams): Promise<NearRawTransaction> {
    const signerId = await this.getWalletAddress();
    return { signerId, params } satisfies NearRawTransaction;
  }

  async signAndSubmitTxn(transaction: NearRawTransaction, options?: NearWalletDefaults): Promise<string> {
    const policy = this.mergeDefaults(options);
    const throwOnFailure = policy.throwOnFailure ?? DEFAULT_THROW_ON_FAILURE;
    const waitUntil = policy.waitUntil ?? DEFAULT_WAIT_UNTIL;
    const gas = transaction.params.gas ?? policy.gasDefault ?? 0n;
    const deposit = transaction.params.deposit ?? policy.depositDefault ?? 0n;

    if (this.account) {
      const res = await this.account.signAndSendTransaction({
        receiverId: transaction.params.contractId,
        actions: [actions.functionCall(transaction.params.method, transaction.params.args, gas, deposit)],
        throwOnFailure,
        waitUntil,
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
              args: jsonObjectToArgs(transaction.params.args),
              gas: gas.toString(),
              deposit: deposit.toString(),
            },
          },
        ],
      });
      return res.transaction_outcome.id;
    }

    throw new Error('Wallet not initialized');
  }
}
