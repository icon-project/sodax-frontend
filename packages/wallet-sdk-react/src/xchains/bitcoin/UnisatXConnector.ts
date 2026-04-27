import type { XAccount } from '@/types/index.js';
import { detectBitcoinAddressType, type IBitcoinWalletProvider, type BtcAddressType } from '@sodax/types';
import { WALLET_METADATA } from '@/constants.js';
import { BitcoinXConnector } from './BitcoinXConnector.js';

// Minimal Unisat window API types
interface UnisatWallet {
  getAccounts(): Promise<string[]>;
  getPublicKey(): Promise<string>;
  signPsbt(psbtHex: string, options?: { autoFinalized?: boolean }): Promise<string>;
  signMessage(message: string, type?: 'bip322-simple' | 'ecdsa'): Promise<string>;
  requestAccounts(): Promise<string[]>;
  sendBitcoin(address: string, satoshis: number): Promise<string>;
}

declare global {
  interface Window {
    unisat?: UnisatWallet;
  }
}

class UnisatWalletProvider implements IBitcoinWalletProvider {
  readonly chainType = 'BITCOIN' as const;
  private unisat: UnisatWallet;
  private cachedAddress: string;

  constructor(unisat: UnisatWallet, address: string) {
    this.unisat = unisat;
    this.cachedAddress = address;
  }

  async getWalletAddress(): Promise<string> {
    try {
      const accounts = await this.unisat.getAccounts();
      if (accounts[0]) this.cachedAddress = accounts[0];
    } catch {
      // wallet locked — fall through to cached address
    }
    return this.cachedAddress;
  }

  async getPublicKey(): Promise<string> {
    return this.unisat.getPublicKey();
  }

  async getAddressType(_address: string): Promise<BtcAddressType> {
    const address = await this.getWalletAddress();
    return detectBitcoinAddressType(address);
  }

  async signTransaction(psbtBase64: string, finalize = false): Promise<string> {
    // Convert base64 → hex for Unisat, then back
    const psbtHex = Buffer.from(psbtBase64, 'base64').toString('hex');
    const signedHex = await this.unisat.signPsbt(psbtHex, { autoFinalized: finalize });
    // Return as hex (BTCWalletProvider.signTransaction expects this)
    return signedHex;
  }

  async signEcdsaMessage(message: string): Promise<string> {
    return this.unisat.signMessage(message, 'ecdsa');
  }

  async signBip322Message(message: string): Promise<string> {
    return this.unisat.signMessage(message, 'bip322-simple');
  }

  async sendBitcoin(toAddress: string, satoshis: bigint): Promise<string> {
    if (satoshis > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`Amount ${satoshis} satoshis exceeds safe integer range`);
    }
    return this.unisat.sendBitcoin(toAddress, Number(satoshis));
  }
}

export class UnisatXConnector extends BitcoinXConnector {
  private walletProvider: UnisatWalletProvider | undefined;

  constructor() {
    super('Unisat', 'unisat');
  }

  public static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.unisat;
  }

  public override get isInstalled(): boolean {
    return UnisatXConnector.isAvailable();
  }

  public override get installUrl(): string {
    return WALLET_METADATA.unisat.installUrl;
  }

  public override get icon(): string {
    return WALLET_METADATA.unisat.icon;
  }

  async connect(): Promise<XAccount | undefined> {
    if (!window.unisat) {
      throw new Error('Unisat wallet is not installed');
    }

    const accounts = await window.unisat.requestAccounts();
    const address = accounts[0];
    if (!address) {
      console.warn('[UnisatXConnector] connect: requestAccounts returned no address');
      return undefined;
    }

    this.walletProvider = new UnisatWalletProvider(window.unisat, address);

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
    if (!window.unisat || !xAccount.address) return undefined;
    return new UnisatWalletProvider(window.unisat, xAccount.address);
  }
}
