export interface WalletAddressProvider {
  getWalletAddress(): Promise<string>; // The wallet address as a string
  getPublicKey?: () => Promise<string>;
}

export interface ICoreWallet extends WalletAddressProvider {}
