import type { XAccount } from '@/types';
import type { IBitcoinWalletProvider, AddressType } from '@sodax/types';
import { AddressPurpose, MessageSigningProtocols } from 'sats-connect';
import { BitcoinXConnector } from './BitcoinXConnector';

// sats-connect types
interface SignPsbtResult {
  psbt: string; // base64 signed PSBT
}

interface GetAccountsResult {
  address: string;
  publicKey: string;
  purpose: string;
  addressType: string;
}

interface SignMessageResult {
  signature: string;
}


class XverseWalletProvider implements IBitcoinWalletProvider {
  private address: string;
  private publicKey: string;

  constructor(address: string, publicKey: string) {
    this.address = address;
    this.publicKey = publicKey;
  }

  async getWalletAddress(): Promise<string> {
    return this.address;
  }

  async getPublicKey(): Promise<string> {
    return this.publicKey;
  }

  async getAddressType(_address: string): Promise<AddressType> {
    const address = this.address;
    if (address.startsWith('bc1p') || address.startsWith('tb1p')) return 'P2TR';
    if (address.startsWith('bc1') || address.startsWith('tb1')) return 'P2WPKH';
    return 'P2PKH';
  }

  async signTransaction(psbtBase64: string, finalize = false): Promise<string> {
    const { request } = await import('sats-connect');

    const response = await request('signPsbt', {
      psbt: psbtBase64,
      broadcast: false,
      // signInputs omitted — Xverse will prompt user to sign all applicable inputs
    });

    if (response.status === 'error') {
      throw new Error(response.error?.message || 'Xverse PSBT signing failed');
    }

    const result = response.result as SignPsbtResult;

    if (finalize) {
      // Return hex for broadcast
      return Buffer.from(result.psbt, 'base64').toString('hex');
    }

    // Return base64 signed PSBT (partially signed)
    return result.psbt;
  }

  async signEcdsaMessage(message: string): Promise<string> {
    const { request } = await import('sats-connect');

    const response = await request('signMessage', {
      address: this.address,
      message,
      protocol: MessageSigningProtocols.ECDSA,
    });

    if (response.status === 'error') {
      throw new Error(response.error?.message || 'Xverse ECDSA signing failed');
    }

    return (response.result as SignMessageResult).signature;
  }

  async signBip322Message(message: string): Promise<string> {
    const { request } = await import('sats-connect');

    const response = await request('signMessage', {
      address: this.address,
      message,
      protocol: MessageSigningProtocols.BIP322,
    });

    if (response.status === 'error') {
      throw new Error(response.error?.message || 'Xverse BIP322 signing failed');
    }

    return (response.result as SignMessageResult).signature;
  }

  async sendBitcoin(toAddress: string, satoshis: bigint): Promise<string> {
    const { request } = await import('sats-connect');

    const response = await request('sendTransfer', {
      recipients: [
        {
          address: toAddress,
          amount: Number(satoshis),
        },
      ],
    });

    if (response.status === 'error') {
      throw new Error(response.error?.message || 'Xverse sendTransfer failed');
    }

    return (response.result as { txid: string }).txid;
  }
}

export class XverseXConnector extends BitcoinXConnector {
  private walletProvider: XverseWalletProvider | undefined;

  constructor() {
    super('Xverse', 'xverse');
  }

  public static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.BitcoinProvider;
  }

  public get icon(): string {
    return 'https://cdn.brandfetch.io/iddzGN5Rcv/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1771902357797';
  }

  async connect(): Promise<XAccount | undefined> {
    const { request } = await import('sats-connect');

    const response = await request('getAccounts', {
      purposes: [AddressPurpose.Payment],
      message: 'Connect to Sodax',
    });

    if (response.status === 'error') {
      throw new Error(response.error?.message || 'Xverse connection failed');
    }

    const accounts = response.result as GetAccountsResult[];
    const paymentAccount = accounts.find(a => a.purpose === AddressPurpose.Payment) || accounts[0];

    if (!paymentAccount) return undefined;

    this.walletProvider = new XverseWalletProvider(
      paymentAccount.address,
      paymentAccount.publicKey,
    );

    return {
      address: paymentAccount.address,
      publicKey: paymentAccount.publicKey,
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
    if (!xAccount.address || !xAccount.publicKey) return undefined;
    return new XverseWalletProvider(xAccount.address, xAccount.publicKey);
  }
}
