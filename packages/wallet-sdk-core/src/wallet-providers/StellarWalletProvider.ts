import type { Hex, IStellarWalletProvider, StellarRawTransactionReceipt, XDR } from '@sodax/types';
import { Networks, Horizon, Transaction, Keypair } from '@stellar/stellar-sdk';
import { BaseWalletProvider } from './BaseWalletProvider.js';

interface StellarWalletsKit {
  getAddress(): Promise<{ address: string }>;
  signTransaction(tx: XDR, options: { networkPassphrase: string }): Promise<{ signedTxXdr: XDR }>;
}

export type StellarNetwork = 'TESTNET' | 'PUBLIC';

const STELLAR_HORIZON_URLS: { [key in StellarNetwork]: string } = {
  TESTNET: 'https://horizon-testnet.stellar.org',
  PUBLIC: 'https://horizon.stellar.org',
};

const STELLAR_NETWORK_PASSPHRASES: { [key in StellarNetwork]: string } = {
  TESTNET: Networks.TESTNET,
  PUBLIC: Networks.PUBLIC,
};

const DEFAULT_POLL_INTERVAL = 2000;
const DEFAULT_POLL_TIMEOUT = 60_000;

/** Defaults applied to every call. Per-call options shallow-merge over these. */
export type StellarWalletDefaults = {
  /** Polling interval (ms) for `waitForTransactionReceipt`. Default `2000`. */
  pollInterval?: number;
  /** Total wait (ms) before timeout. Default `60_000`. Recommended floor `30_000` on mainnet. */
  pollTimeout?: number;
  /** Custom Horizon URL (overrides per-network default). */
  horizonUrl?: string;
  /** Custom network passphrase (use for FUTURENET / private networks). */
  networkPassphrase?: string;
};

const STELLAR_ERROR_CODES = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  SIGN_TX_ERROR: 'SIGN_TX_ERROR',
  TX_RECEIPT_TIMEOUT: 'TX_RECEIPT_TIMEOUT',
  SEND_TX_ERROR: 'SEND_TX_ERROR',
  INVALID_NETWORK: 'INVALID_NETWORK',
  INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',
} as const;

export type StellarAddress = string; // Stellar addresses are in format: G...

export type PrivateKeyStellarWalletConfig = {
  type: 'PRIVATE_KEY';
  privateKey: Hex;
  network: StellarNetwork;
  rpcUrl?: string;
  defaults?: StellarWalletDefaults;
};

export type BrowserExtensionStellarWalletConfig = {
  type: 'BROWSER_EXTENSION';
  walletsKit: StellarWalletsKit;
  network: StellarNetwork;
  rpcUrl?: string;
  defaults?: StellarWalletDefaults;
};

export type StellarWalletConfig = PrivateKeyStellarWalletConfig | BrowserExtensionStellarWalletConfig;

export type StellarPkWallet = {
  type: 'PRIVATE_KEY';
  keypair: Keypair;
};

export type StellarBrowserExtensionWallet = {
  type: 'BROWSER_EXTENSION';
  walletsKit: StellarWalletsKit;
};

export type StellarWallet = StellarPkWallet | StellarBrowserExtensionWallet;

export class StellarWalletError extends Error {
  constructor(
    message: string,
    public readonly code: keyof typeof STELLAR_ERROR_CODES,
  ) {
    super(message);
    this.name = 'StellarWalletError';
  }
}

export function isPrivateKeyStellarWalletConfig(config: StellarWalletConfig): config is PrivateKeyStellarWalletConfig {
  return config.type === 'PRIVATE_KEY';
}

export function isBrowserExtensionStellarWalletConfig(
  config: StellarWalletConfig,
): config is BrowserExtensionStellarWalletConfig {
  return config.type === 'BROWSER_EXTENSION';
}

export function isStellarPkWallet(wallet: StellarWallet): wallet is StellarPkWallet {
  return wallet.type === 'PRIVATE_KEY';
}

export function isStellarBrowserExtensionWallet(wallet: StellarWallet): wallet is StellarBrowserExtensionWallet {
  return wallet.type === 'BROWSER_EXTENSION';
}

export function isValidStellarNetwork(network: string): network is StellarNetwork {
  return ['TESTNET', 'PUBLIC'].includes(network);
}

export function isValidStellarPrivateKey(privateKey: string): boolean {
  try {
    // Remove '0x' prefix if present
    const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    Keypair.fromSecret(key);
    return true;
  } catch {
    return false;
  }
}

export class StellarWalletProvider
  extends BaseWalletProvider<StellarWalletDefaults>
  implements IStellarWalletProvider
{
  public readonly chainType = 'STELLAR' as const;
  private readonly wallet: StellarWallet;
  private readonly server: Horizon.Server;
  private readonly networkPassphrase: string;

  constructor(config: StellarWalletConfig) {
    super(config.defaults);
    if (!isValidStellarNetwork(config.network)) {
      throw new StellarWalletError(`Invalid network: ${config.network}`, 'INVALID_NETWORK');
    }

    const horizonUrl = this.defaults.horizonUrl ?? config.rpcUrl ?? STELLAR_HORIZON_URLS[config.network];
    this.networkPassphrase = this.defaults.networkPassphrase ?? STELLAR_NETWORK_PASSPHRASES[config.network];
    this.server = new Horizon.Server(horizonUrl);

    if (isPrivateKeyStellarWalletConfig(config)) {
      if (!isValidStellarPrivateKey(config.privateKey)) {
        throw new StellarWalletError('Invalid private key format', 'INVALID_PRIVATE_KEY');
      }
      const privateKey = config.privateKey.startsWith('0x') ? config.privateKey.slice(2) : config.privateKey;
      this.wallet = { type: 'PRIVATE_KEY', keypair: Keypair.fromSecret(privateKey) };
      return;
    }

    if (isBrowserExtensionStellarWalletConfig(config)) {
      this.wallet = { type: 'BROWSER_EXTENSION', walletsKit: config.walletsKit };
      return;
    }

    throw new StellarWalletError('Invalid wallet configuration', 'INVALID_CONFIG');
  }

  public async getWalletAddress(): Promise<string> {
    try {
      if (isStellarPkWallet(this.wallet)) {
        return this.wallet.keypair.publicKey();
      }

      const { address } = await this.wallet.walletsKit.getAddress();
      return address;
    } catch (error) {
      throw new StellarWalletError(
        error instanceof Error ? error.message : 'Failed to get wallet address',
        'INVALID_CONFIG',
      );
    }
  }

  public async signTransaction(tx: XDR): Promise<XDR> {
    try {
      if (isStellarPkWallet(this.wallet)) {
        // Parse the XDR transaction
        const transaction = new Transaction(tx, this.networkPassphrase);
        transaction.sign(this.wallet.keypair);
        return transaction.toXDR();
      }

      const { signedTxXdr } = await this.wallet.walletsKit.signTransaction(tx, {
        networkPassphrase: this.networkPassphrase,
      });
      return signedTxXdr;
    } catch (error) {
      throw new StellarWalletError(
        error instanceof Error ? error.message : 'Failed to sign transaction',
        'SIGN_TX_ERROR',
      );
    }
  }

  public async waitForTransactionReceipt(
    txHash: string,
    options?: Pick<StellarWalletDefaults, 'pollInterval' | 'pollTimeout'>,
  ): Promise<StellarRawTransactionReceipt> {
    const policy = this.mergeDefaults(options);
    const pollInterval = policy.pollInterval ?? DEFAULT_POLL_INTERVAL;
    const pollTimeout = policy.pollTimeout ?? DEFAULT_POLL_TIMEOUT;

    const startTime = Date.now();
    while (Date.now() - startTime < pollTimeout) {
      try {
        const tx = await this.server.transactions().transaction(txHash).call();
        return {
          ...tx,
          _links: { ...tx._links, transaction: tx._links.self },
        };
      } catch {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    throw new StellarWalletError(
      `Transaction receipt not found for hash ${txHash} after ${pollTimeout / 1000} seconds.`,
      'TX_RECEIPT_TIMEOUT',
    );
  }
}
