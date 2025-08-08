export type Hex = `0x${string}`;
export type Address = `0x${string}`;
export type Hash = `0x${string}`;

export interface WalletAddressProvider {
  getWalletAddress: () => Promise<string>;
  getWalletAddressBytes: () => Promise<Hex>;
}
