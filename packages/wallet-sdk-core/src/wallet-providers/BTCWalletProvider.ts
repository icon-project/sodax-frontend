import type { AddressType, Hex, IBitcoinWalletProvider } from '@sodax/types';
import * as bitcoin from 'bitcoinjs-lib';
import type { ECPairInterface } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { keccak256 } from 'viem';
import secp256k1 from 'secp256k1';
import * as bip322 from "bip322-js"

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export type BitcoinNetwork = 'TESTNET' | 'MAINNET';

export interface BitcoinWalletsKit {
  getAccounts(): Promise<string[]>;
  signPsbt(psbtHex: string): Promise<{ psbtHex: string }>;
  signMessage(message: string): Promise<string>;
  signEcdsaMessage(message: string): Promise<string>;
  signBip322Message(message: string): Promise<string>;
  getPublicKey(): Promise<string>;
}

export type PrivateKeyBitcoinWalletConfig = {
  type: 'PRIVATE_KEY';
  privateKey: Hex;
  network: BitcoinNetwork;
  addressType?: AddressType;
};

export type BrowserExtensionBitcoinWalletConfig = {
  type: 'BROWSER_EXTENSION';
  walletsKit: BitcoinWalletsKit;
  network: BitcoinNetwork;
};

export type BitcoinWalletConfig =
  | PrivateKeyBitcoinWalletConfig
  | BrowserExtensionBitcoinWalletConfig;

type BitcoinPkWallet = {
  type: 'PRIVATE_KEY';
  keyPair: ECPairInterface;
  addressType: AddressType;
};

type BitcoinBrowserWallet = {
  type: 'BROWSER_EXTENSION';
  walletsKit: BitcoinWalletsKit;
};

type BitcoinWallet = BitcoinPkWallet | BitcoinBrowserWallet;

export class BitcoinWalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BitcoinWalletError';
  }
}

function isPkConfig(
  config: BitcoinWalletConfig,
): config is PrivateKeyBitcoinWalletConfig {
  return config.type === 'PRIVATE_KEY';
}

function isPkWallet(wallet: BitcoinWallet): wallet is BitcoinPkWallet {
  return wallet.type === 'PRIVATE_KEY';
}

const NETWORKS: Record<BitcoinNetwork, bitcoin.networks.Network> = {
  TESTNET: bitcoin.networks.testnet,
  MAINNET: bitcoin.networks.bitcoin,
};


export class BitcoinWalletProvider implements IBitcoinWalletProvider {
  private readonly wallet: BitcoinWallet;
  private readonly network: bitcoin.networks.Network;

  constructor(config: BitcoinWalletConfig) {
    this.network = NETWORKS[config.network];

    if (isPkConfig(config)) {
      const keyHex = config.privateKey.startsWith('0x')
        ? config.privateKey.slice(2)
        : config.privateKey;

      const keyPair = ECPair.fromPrivateKey(Buffer.from(keyHex, 'hex'), {
        network: this.network,
      });

      this.wallet = {
        type: 'PRIVATE_KEY',
        keyPair,
        addressType: config.addressType ?? 'P2WPKH',
      };
      return;
    }

    this.wallet = {
      type: 'BROWSER_EXTENSION',
      walletsKit: config.walletsKit,
    };
  }

  async getWalletAddress(): Promise<string> {
    if (isPkWallet(this.wallet)) {
      const payment = this.getPayment(
        this.wallet.keyPair,
        this.wallet.addressType, // optional if you already pass type
      );

      if (!payment.address) {
        throw new BitcoinWalletError('Failed to derive address');
      }
      return payment.address;
    }

    const accounts = await this.wallet.walletsKit.getAccounts();

    const address = accounts?.[0];
    if (!address) {
      throw new BitcoinWalletError('No wallet accounts found');
    }

    return address;
  }


  async getPublicKey(): Promise<string> {
    if (isPkWallet(this.wallet)) {
      if (this.wallet.addressType === 'P2TR') {
        // x-only pubkey
        return this.wallet.keyPair.publicKey.slice(1, 33).toString('hex');
      }
      return this.wallet.keyPair.publicKey.toString('hex');
    }

    return this.wallet.walletsKit.getPublicKey();
  }

  async getAddressType(address: string): Promise<AddressType> {
    // Taproot (bech32m)
    if (
      address.startsWith('bc1p') ||
      address.startsWith('tb1p')
    ) {
      return 'P2TR';
    }

    // Native SegWit (bech32)
    if (
      address.startsWith('bc1') ||
      address.startsWith('tb1')
    ) {
      return 'P2WPKH';
    }

    // Legacy P2PKH
    if (
      address.startsWith('1') ||
      address.startsWith('m') ||
      address.startsWith('n')
    ) {
      return 'P2PKH';
    }

    throw new BitcoinWalletError(`Unknown address type: ${address}`);
  }


  /**
   * Sign PSBT and return fully signed transaction hex
   */
  async signTransaction(psbtBase64: string, finalize: boolean = true): Promise<string> {
    if (isPkWallet(this.wallet)) {
      const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network: this.network });

      if (this.wallet.addressType === 'P2TR' && finalize) {
        const xOnlyPubkey = this.wallet.keyPair.publicKey.slice(1, 33);
        const tweakedKey = this.wallet.keyPair.tweak(
          bitcoin.crypto.taggedHash('TapTweak', xOnlyPubkey),
        );
        psbt.signAllInputs(tweakedKey);
      } else {
        psbt.signAllInputs(this.wallet.keyPair);
      }
      if (!finalize) {
        return psbt.toBase64();
      }
      psbt.finalizeAllInputs();
      return psbt.extractTransaction().toHex();
    }

    const { psbtHex: signedPsbt } =
      await this.wallet.walletsKit.signPsbt(psbtBase64);
    if (!finalize) {
      return signedPsbt;
    }
    const psbt = bitcoin.Psbt.fromHex(signedPsbt, { network: this.network });
    return psbt.extractTransaction().toHex();
  }

  /**
   * Sign arbitrary message using ECDSA
   * Used for withdrawals
   */
  async signEcdsaMessage(message: string): Promise<string> {
    if (isPkWallet(this.wallet)) {
      const privateKey = this.wallet.keyPair.privateKey;
      if (!privateKey) {
        throw new BitcoinWalletError('Private key not available');
      }
      const hash = Buffer.from(keccak256(Buffer.from(message)).slice(2), 'hex');
      const { signature, recid } = secp256k1.ecdsaSign(hash, Uint8Array.from(privateKey));
      return Buffer.concat([
        Buffer.from(signature),
        Buffer.from([recid])
      ]).toString("hex");
    }
    // Browser / extension wallet
    return this.wallet.walletsKit.signEcdsaMessage(message);
  }

  async signBip322Message(message: string): Promise<string> {
    if (isPkWallet(this.wallet)) {
      const privateKey = this.wallet.keyPair.privateKey;
      if (!privateKey) {
        throw new BitcoinWalletError('Private key not available');
      }
      const signature = bip322.Signer.sign(
        this.wallet.keyPair.toWIF(),
        await this.getWalletAddress(),
        message,
      )
      return signature;
    }
    // Browser / extension wallet
    return this.wallet.walletsKit.signBip322Message(message);
  }

  public getPayment(
    keyPair: ECPairInterface,
    addressType: AddressType,
  ): bitcoin.Payment {
    switch (addressType) {
      case 'P2PKH':
        return bitcoin.payments.p2pkh({
          pubkey: keyPair.publicKey,
          network: this.network,
        });

      case 'P2WPKH':
        return bitcoin.payments.p2wpkh({
          pubkey: keyPair.publicKey,
          network: this.network,
        });

      case 'P2TR':
        return bitcoin.payments.p2tr({
          internalPubkey: keyPair.publicKey.slice(1, 33),
          network: this.network,
        });

      default:
        throw new BitcoinWalletError(
          `Unsupported address type: ${addressType}`,
        );
    }
  }
}
