import type { Hex, IStellarWalletProvider, StellarRawTransactionReceipt, XDR } from '@sodax/types';
import { Networks, Horizon, Transaction, Keypair } from '@stellar/stellar-sdk';

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

const TX_POLL_INTERVAL = 2000; // 2 seconds
const TX_POLL_TIMEOUT = 60000; // 60 seconds

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
};

export type BrowserExtensionStellarWalletConfig = {
  type: 'BROWSER_EXTENSION';
  walletsKit: StellarWalletsKit;
  network: StellarNetwork;
  rpcUrl?: string;
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

export class StellarWalletProvider implements IStellarWalletProvider {
  private readonly wallet: StellarWallet;
  private readonly server: Horizon.Server;
  private readonly networkPassphrase: string;

  constructor(config: StellarWalletConfig) {
    if (!isValidStellarNetwork(config.network)) {
      throw new StellarWalletError(`Invalid network: ${config.network}`, 'INVALID_NETWORK');
    }

    if (isPrivateKeyStellarWalletConfig(config)) {
      if (!isValidStellarPrivateKey(config.privateKey)) {
        throw new StellarWalletError('Invalid private key format', 'INVALID_PRIVATE_KEY');
      }
      // Remove '0x' prefix if present
      const privateKey = config.privateKey.startsWith('0x') ? config.privateKey.slice(2) : config.privateKey;
      this.wallet = {
        type: 'PRIVATE_KEY',
        keypair: Keypair.fromSecret(privateKey),
      };
      this.server = new Horizon.Server(config.rpcUrl ?? STELLAR_HORIZON_URLS[config.network]);
      this.networkPassphrase = STELLAR_NETWORK_PASSPHRASES[config.network];
      return;
    }

    if (isBrowserExtensionStellarWalletConfig(config)) {
      this.wallet = {
        type: 'BROWSER_EXTENSION',
        walletsKit: config.walletsKit,
      };
      this.server = new Horizon.Server(config.rpcUrl ?? STELLAR_HORIZON_URLS[config.network]);
      this.networkPassphrase = STELLAR_NETWORK_PASSPHRASES[config.network];
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

  public async waitForTransactionReceipt(txHash: string): Promise<StellarRawTransactionReceipt> {
    const startTime = Date.now();
    while (Date.now() - startTime < TX_POLL_TIMEOUT) {
      try {
        const tx = await this.server.transactions().transaction(txHash).call();

        return {
          ...tx,
          _links: {
            ...tx._links,
            transaction: tx._links.self,
          },
        };
      } catch (error) {
        // Wait for the next poll interval
        await new Promise(resolve => setTimeout(resolve, TX_POLL_INTERVAL));
      }
    }
    throw new StellarWalletError(
      `Transaction receipt not found for hash ${txHash} after ${TX_POLL_TIMEOUT / 1000} seconds.`,
      'TX_RECEIPT_TIMEOUT',
    );
  }
}
