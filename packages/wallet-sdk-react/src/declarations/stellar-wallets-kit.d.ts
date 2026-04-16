/**
 * Ambient module declaration for @creit.tech/stellar-wallets-kit.
 *
 * The package's own .d.ts files use extensionless relative imports
 * (e.g. `export * from './types'`) which are invalid under moduleResolution: "NodeNext".
 * This declaration re-exports the subset of types wallet-sdk-react actually uses
 * so TypeScript can resolve them.
 */
declare module '@creit.tech/stellar-wallets-kit' {
  export interface ISupportedWallet {
    icon: string;
    id: string;
    isAvailable: boolean;
    name: string;
    type: string;
    url: string;
  }

  export interface ModuleInterface extends KitActions {
    productId: string;
    productName: string;
    productUrl: string;
    productIcon: string;
  }

  export interface KitActions {
    signTransaction(
      xdr: string,
      opts?: { networkPassphrase?: string; address?: string; path?: string; submit?: boolean; submitUrl?: string },
    ): Promise<{ signedTxXdr: string; signerAddress?: string }>;
    signAuthEntry(
      authEntry: string,
      opts?: { networkPassphrase?: string; address?: string; path?: string },
    ): Promise<{ signedAuthEntry: string; signerAddress?: string }>;
    signMessage(
      message: string,
      opts?: { networkPassphrase?: string; address?: string; path?: string },
    ): Promise<{ signedMessage: string; signerAddress?: string }>;
    getAddress(params?: { path?: string; skipRequestAccess?: boolean }): Promise<{ address: string }>;
    getNetwork(): Promise<{ network: string; networkPassphrase: string }>;
  }

  export enum WalletNetwork {
    PUBLIC = 'Public Global Stellar Network ; September 2015',
    TESTNET = 'Test SDF Network ; September 2015',
    FUTURENET = 'Test SDF Future Network ; October 2022',
    SANDBOX = 'Local Sandbox Stellar Network ; September 2022',
    STANDALONE = 'Standalone Network ; February 2017',
  }

  export interface StellarWalletsKitParams {
    selectedWalletId?: string;
    network: WalletNetwork;
    modules: ModuleInterface[];
  }

  export class StellarWalletsKit implements KitActions {
    constructor(params: StellarWalletsKitParams);
    getSupportedWallets(): Promise<ISupportedWallet[]>;
    setWallet(id: string): void;
    getAddress(params?: { path?: string; skipRequestAccess?: boolean }): Promise<{ address: string }>;
    signTransaction(
      xdr: string,
      opts?: { networkPassphrase?: string; address?: string; path?: string; submit?: boolean; submitUrl?: string },
    ): Promise<{ signedTxXdr: string; signerAddress?: string }>;
    signAuthEntry(
      authEntry: string,
      opts?: { networkPassphrase?: string; address?: string; path?: string },
    ): Promise<{ signedAuthEntry: string; signerAddress?: string }>;
    signMessage(
      message: string,
      opts?: { networkPassphrase?: string; address?: string; path?: string },
    ): Promise<{ signedMessage: string; signerAddress?: string }>;
    getNetwork(): Promise<{ network: string; networkPassphrase: string }>;
  }

  export function allowAllModules(opts?: { filterBy: (module: ModuleInterface) => boolean }): ModuleInterface[];
}
