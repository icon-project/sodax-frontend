import type { XAccount } from '@/types/index.js';
import { detectBitcoinAddressType, type IBitcoinWalletProvider, type AddressType } from '@sodax/types';
import { WALLET_METADATA } from '@/constants.js';
import { BitcoinXConnector } from './BitcoinXConnector.js';

// OKX Bitcoin wallet window API types
interface OKXBitcoinWallet {
  getAccounts(): Promise<string[]>;
  getPublicKey(): Promise<string>;
  signPsbt(psbtHex: string, options?: { autoFinalized?: boolean }): Promise<string>;
  signMessage(message: string, type?: 'bip322-simple' | 'ecdsa'): Promise<string>;
  connect(): Promise<{ address: string; publicKey: string }>;
  sendBitcoin(toAddress: string, satoshis: number): Promise<string>;
}

declare global {
  interface Window {
    okxwallet?: {
      bitcoin?: OKXBitcoinWallet;
    };
  }
}

class OKXWalletProvider implements IBitcoinWalletProvider {
  private okx: OKXBitcoinWallet;
  private cachedAddress: string;

  constructor(okx: OKXBitcoinWallet, address: string) {
    this.okx = okx;
    this.cachedAddress = address;
  }

  async getWalletAddress(): Promise<string> {
    try {
      const accounts = await this.okx.getAccounts();
      if (accounts[0]) this.cachedAddress = accounts[0];
    } catch {
      // wallet locked — fall through to cached address
    }
    return this.cachedAddress;
  }

  async getPublicKey(): Promise<string> {
    return this.okx.getPublicKey();
  }

  async getAddressType(_address: string): Promise<AddressType> {
    const address = await this.getWalletAddress();
    return detectBitcoinAddressType(address);
  }

  async signTransaction(psbtBase64: string, finalize = false): Promise<string> {
    const psbtHex = Buffer.from(psbtBase64, 'base64').toString('hex');
    return this.okx.signPsbt(psbtHex, { autoFinalized: finalize });
  }

  async signEcdsaMessage(message: string): Promise<string> {
    return this.okx.signMessage(message, 'ecdsa');
  }

  async signBip322Message(message: string): Promise<string> {
    return this.okx.signMessage(message, 'bip322-simple');
  }

  async sendBitcoin(toAddress: string, satoshis: bigint): Promise<string> {
    if (satoshis > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`Amount ${satoshis} satoshis exceeds safe integer range`);
    }
    return this.okx.sendBitcoin(toAddress, Number(satoshis));
  }
}

export class OKXXConnector extends BitcoinXConnector {
  private walletProvider: OKXWalletProvider | undefined;

  constructor() {
    super('OKX Wallet', 'okx-bitcoin');
  }

  public static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.okxwallet?.bitcoin;
  }

  public override get isInstalled(): boolean {
    return OKXXConnector.isAvailable();
  }

  public override get installUrl(): string {
    return WALLET_METADATA.okx.installUrl;
  }

  public override get icon(): string {
    return WALLET_METADATA.okx.iconUrl;
  }

  async connect(): Promise<XAccount | undefined> {
    const okx = window.okxwallet?.bitcoin;
    if (!okx) {
      throw new Error('OKX wallet is not installed');
    }

    const { address } = await okx.connect();
    if (!address) {
      console.warn('[OKXXConnector] connect: okx.connect() returned no address');
      return undefined;
    }

    this.walletProvider = new OKXWalletProvider(okx, address);

    return {
      address,
      xChainType: 'BITCOIN',
    };
  }

  async disconnect(): Promise<void> {
    this.walletProvider = undefined;
  }

  getWalletProvider(): IBitcoinWalletProvider | undefined {
    return this.walletProvider;
  }

  recreateWalletProvider(xAccount: XAccount): IBitcoinWalletProvider | undefined {
    const okx = window.okxwallet?.bitcoin;
    if (!okx || !xAccount.address) return undefined;
    return new OKXWalletProvider(okx, xAccount.address);
  }
}
