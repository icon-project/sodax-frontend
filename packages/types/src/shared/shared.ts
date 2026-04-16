/**
 * Shared types (must not be circular dependencies! Import only from other packages in this project)
 * Forbidden to import types from other packages in this file!
 */

export type ByteArray = Uint8Array;
export type Base64String = string;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type Address = `0x${string}`;
export type HubAddress = Address;
export type OriginalAssetAddress = string;
export type HttpUrl = `http://${string}` | `https://${string}`;

export interface WalletAddressProvider {
  getWalletAddress(): Promise<string>; // The wallet address as a string
  getPublicKey?: () => Promise<string>;
}
