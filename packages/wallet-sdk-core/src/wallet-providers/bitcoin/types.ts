import type { BtcAddressType, Hex } from '@sodax/types';
import type { ECPairInterface } from 'ecpair';

export type BitcoinNetwork = 'TESTNET' | 'MAINNET';

export interface BitcoinWalletsKit {
  getAccounts(): Promise<string[]>;
  signPsbt(psbtHex: string): Promise<{ psbtHex: string }>;
  signMessage(message: string): Promise<string>;
  signEcdsaMessage(message: string): Promise<string>;
  signBip322Message(message: string): Promise<string>;
  getPublicKey(): Promise<string>;
  sendBitcoin?(toAddress: string, satoshis: number): Promise<string>;
}

/** Defaults applied to every call. Per-call options shallow-merge over these. */
export type BitcoinWalletDefaults = {
  /** Default address type for private-key mode. Default `'P2WPKH'`. */
  addressType?: BtcAddressType;
  /** Default `finalize` flag for `signTransaction`. Default `true`. */
  defaultFinalize?: boolean;
};

export type PrivateKeyBitcoinWalletConfig = {
  type: 'PRIVATE_KEY';
  privateKey: Hex;
  network: BitcoinNetwork;
  addressType?: BtcAddressType;
  defaults?: BitcoinWalletDefaults;
};

export type BrowserExtensionBitcoinWalletConfig = {
  type: 'BROWSER_EXTENSION';
  walletsKit: BitcoinWalletsKit;
  network: BitcoinNetwork;
  defaults?: BitcoinWalletDefaults;
};

export type BitcoinWalletConfig = PrivateKeyBitcoinWalletConfig | BrowserExtensionBitcoinWalletConfig;

export type BitcoinPkWallet = {
  type: 'PRIVATE_KEY';
  keyPair: ECPairInterface;
  addressType: BtcAddressType;
};

export type BitcoinBrowserWallet = {
  type: 'BROWSER_EXTENSION';
  walletsKit: BitcoinWalletsKit;
};

export type BitcoinWallet = BitcoinPkWallet | BitcoinBrowserWallet;
