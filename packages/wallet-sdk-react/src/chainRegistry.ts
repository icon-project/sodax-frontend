import {
  type ChainType,
  type RpcConfig,
  type BitcoinRpcConfig,
  type StellarRpcConfig,
  ICON_MAINNET_CHAIN_ID,
  detectBitcoinAddressType,
} from '@sodax/types';
import {
  IconWalletProvider,
  InjectiveWalletProvider,
  StellarWalletProvider,
  NearWalletProvider,
  StacksWalletProvider,
} from '@sodax/wallet-sdk-core';
import { Wallet } from '@injectivelabs/wallet-base';
import { getEthereumAddress } from '@injectivelabs/sdk-ts';

import type { XService, XConnector } from './core';
import type { XConnection, WalletProvider } from './types';
import type { IXConnector } from './types/interfaces';
import type { ChainsConfig } from './types/config';
import type { ChainActions, ChainActionsRegistry } from './types/chainActions';

import { EvmXService } from './xchains/evm';
import { SolanaXService } from './xchains/solana/SolanaXService';
import { SuiXService } from './xchains/sui';
import { StellarXService, StellarWalletsKitXConnector } from './xchains/stellar';
import { IconXService, CHAIN_INFO, SupportedChainId } from './xchains/icon';
import { IconHanaXConnector } from './xchains/icon/IconHanaXConnector';
import { InjectiveXConnector, InjectiveXService } from './xchains/injective';
import { BitcoinXService } from './xchains/bitcoin';
import { UnisatXConnector } from './xchains/bitcoin/UnisatXConnector';
import { XverseXConnector } from './xchains/bitcoin/XverseXConnector';
import { OKXXConnector } from './xchains/bitcoin/OKXXConnector';
import type { BitcoinXConnector } from './xchains/bitcoin/BitcoinXConnector';
import { NearXService } from './xchains/near/NearXService';
import { NearXConnector } from './xchains/near/NearXConnector';
import { StacksXService, StacksXConnector, STACKS_PROVIDERS } from './xchains/stacks';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Store accessor — avoids circular dependency with useXWalletStore */
export type StoreAccessor = () => {
  xConnections: Partial<Record<ChainType, XConnection>>;
  xServices: Partial<Record<ChainType, XService>>;
  setXConnectors: (xChainType: ChainType, connectors: XConnector[]) => void;
  unsetXConnection: (xChainType: ChainType) => void;
  setWalletProvider: (xChainType: ChainType, provider: WalletProvider | undefined) => void;
};

export type ChainServiceFactory<S extends XService = XService> = {
  /** Create or get the XService singleton for this chain. */
  createService: (rpcConfig?: RpcConfig) => S;
  /** Static connectors known at build time. Ignored for provider-managed chains. */
  defaultConnectors: () => XConnector[];
  /** true = needs React provider (EVM/Solana/Sui), false = browser extension APIs. */
  providerManaged: boolean;
  /** ChainActions for non-provider chains. If omitted, uses createDefaultActions(). */
  createActions?: (service: S, getStore: StoreAccessor) => ChainActions;
  /** Wallet provider for non-provider chains. Called on setXConnection(). */
  createWalletProvider?: (service: S, getStore: StoreAccessor) => WalletProvider | undefined;
  /**
   * Async connector discovery for chains whose available wallets can only be detected at runtime
   * (e.g. browser extension scan, manifest loading). Runs once after init, updates store.xConnectorsByChain when done.
   * Use when wallet detection requires async operations — if connectors are known statically, use defaultConnectors() instead.
   *
   * Example: Stellar scans for installed browser wallets via walletsKit.getSupportedWallets(),
   * NEAR loads wallet manifest via walletSelector.whenManifestLoaded.
   */
  discoverConnectors?: (service: S, getStore: StoreAccessor) => Promise<void>;
};

/**
 * Type-checked factory definition — S is inferred from createService return type,
 * so all callbacks (createActions, createWalletProvider, discoverConnectors) receive the concrete service type.
 * Erased to ChainServiceFactory (base) at registry level. Safe because createChainServices always passes
 * the service instance created by the same factory's createService().
 */
function defineChain<S extends XService>(factory: ChainServiceFactory<S>): ChainServiceFactory {
  return factory as unknown as ChainServiceFactory;
}

export type ChainServicesResult = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>;
  enabledChains: ChainType[];
  chainActions: ChainActionsRegistry;
};

// ─── Default Actions Helper ─────────────────────────────────────────────────

const createDefaultActions = (chainType: ChainType, service: XService, getStore: StoreAccessor): ChainActions => ({
  connect: async (xConnectorId: string) => {
    const connector = service.getXConnectorById(xConnectorId);
    return connector?.connect();
  },
  disconnect: async () => {
    const store = getStore();
    const connectorId = store.xConnections[chainType]?.xConnectorId;
    const connector = connectorId ? service.getXConnectorById(connectorId) : undefined;
    await connector?.disconnect();
    store.unsetXConnection(chainType);
  },
  getConnectors: () => service.getXConnectors(),
  getConnection: () => getStore().xConnections[chainType],
});

// ─── Chain Registry ──────────────────────────────────────────────────────────

export const chainRegistry: Record<string, ChainServiceFactory> = {
  EVM: defineChain({
    createService: () => EvmXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: true,
  }),
  SUI: defineChain({
    createService: () => SuiXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: true,
  }),
  SOLANA: defineChain({
    createService: () => SolanaXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: true,
  }),
  BITCOIN: defineChain({
    createService: rpcConfig =>
      BitcoinXService.getInstance((rpcConfig?.bitcoin as BitcoinRpcConfig | undefined)?.rpcUrl),
    defaultConnectors: () => [new UnisatXConnector(), new XverseXConnector(), new OKXXConnector()],
    providerManaged: false,
    createActions: (service, getStore) => ({
      ...createDefaultActions('BITCOIN', service, getStore),
      signMessage: async (message: string) => {
        const store = getStore();
        const connection = store.xConnections.BITCOIN;
        const connector = connection?.xConnectorId
          ? (service.getXConnectorById(connection.xConnectorId) as BitcoinXConnector | undefined)
          : undefined;
        if (!connector) {
          throw new Error('Bitcoin wallet not connected');
        }
        const address = connection?.xAccount.address;
        if (!address) throw new Error('Bitcoin address not found');
        const addressType = detectBitcoinAddressType(address);

        switch (addressType) {
          case 'P2WPKH':
          case 'P2TR': {
            if (!('signBip322Message' in connector)) {
              throw new Error(`${connector.id} does not support BIP-322 signing`);
            }
            return (connector as BitcoinXConnector & { signBip322Message: (msg: string) => Promise<string> })
              .signBip322Message(message);
          }
          case 'P2SH':
          case 'P2PKH': {
            if (!('signEcdsaMessage' in connector)) {
              throw new Error(`${connector.id} does not support ECDSA signing`);
            }
            return (connector as BitcoinXConnector & { signEcdsaMessage: (msg: string) => Promise<string> })
              .signEcdsaMessage(message);
          }
          default: {
            const _exhaustiveCheck: never = addressType;
            throw new Error(`Unhandled Bitcoin address type: ${_exhaustiveCheck}`);
          }
        }
      },
    }),
    createWalletProvider: (service, getStore) => {
      const store = getStore();
      const connection = store.xConnections.BITCOIN;
      if (!connection?.xConnectorId) return undefined;
      const connector = service.getXConnectorById(connection.xConnectorId) as BitcoinXConnector | undefined;
      if (!connector) return undefined;
      return connector.recreateWalletProvider(connection.xAccount);
    },
  }),
  INJECTIVE: defineChain({
    createService: () => InjectiveXService.getInstance(),
    defaultConnectors: () => [
      new InjectiveXConnector('MetaMask', Wallet.Metamask),
      new InjectiveXConnector('Keplr', Wallet.Keplr),
      new InjectiveXConnector('Leap', Wallet.Leap),
    ],
    providerManaged: false,
    createActions: (service, getStore) => ({
      ...createDefaultActions('INJECTIVE', service, getStore),
      signMessage: async (message: string) => {
        const store = getStore();
        const address = store.xConnections.INJECTIVE?.xAccount.address;
        if (!address) throw new Error('Injective address not found');

        const ethereumAddress = getEthereumAddress(address);
        const walletStrategy = service.walletStrategy;
        const res = await walletStrategy.signArbitrary(
          walletStrategy.getWallet() === Wallet.Metamask ? ethereumAddress : address,
          message,
        );
        if (!res) throw new Error('Injective signature not found');
        return res;
      },
    }),
    createWalletProvider: service => {
      if (!service) return undefined;
      return new InjectiveWalletProvider({ msgBroadcaster: service.msgBroadcaster });
    },
  }),
  STELLAR: defineChain({
    createService: rpcConfig => {
      const stellarRpc = rpcConfig?.stellar as StellarRpcConfig | undefined;
      return StellarXService.getInstance(stellarRpc?.horizonRpcUrl, stellarRpc?.sorobanRpcUrl);
    },
    defaultConnectors: () => [],
    providerManaged: false,
    discoverConnectors: async (service, getStore) => {
      const wallets = await service.walletsKit.getSupportedWallets();
      const connectors = wallets.filter(w => w.isAvailable).map(w => new StellarWalletsKitXConnector(w));
      service.setXConnectors(connectors);
      getStore().setXConnectors('STELLAR', connectors);
    },
    createActions: (service, getStore) => ({
      ...createDefaultActions('STELLAR', service, getStore),
      signMessage: async (message: string) => {
        const res = await service.walletsKit.signMessage(message);
        return res.signedMessage;
      },
    }),
    createWalletProvider: service => {
      if (!service?.walletsKit) return undefined;
      return new StellarWalletProvider({
        type: 'BROWSER_EXTENSION',
        walletsKit: service.walletsKit,
        network: 'PUBLIC',
      });
    },
  }),
  // ICON: signMessage not implemented — Hana wallet does not expose a signing API.
  // connect/disconnect use createDefaultActions (no createActions override needed).
  ICON: defineChain({
    createService: rpcConfig => IconXService.getInstance(rpcConfig?.[ICON_MAINNET_CHAIN_ID] as string | undefined),
    defaultConnectors: () => [new IconHanaXConnector()],
    providerManaged: false,
    createWalletProvider: (_service, getStore) => {
      const address = getStore().xConnections.ICON?.xAccount.address;
      if (!address) return undefined;
      return new IconWalletProvider({
        walletAddress: address as `hx${string}`,
        rpcUrl: CHAIN_INFO[SupportedChainId.MAINNET].APIEndpoint as `http${string}`,
      });
    },
  }),
  NEAR: defineChain({
    createService: () => NearXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: false,
    discoverConnectors: async (service, getStore) => {
      await service.walletSelector.whenManifestLoaded;
      const connectors = service.walletSelector.availableWallets.map(w => new NearXConnector(w));
      service.setXConnectors(connectors);
      getStore().setXConnectors('NEAR', connectors);
    },
    createActions: (service, getStore) => ({
      ...createDefaultActions('NEAR', service, getStore),
      disconnect: async () => {
        service.walletSelector.disconnect();
        getStore().unsetXConnection('NEAR');
      },
    }),
    createWalletProvider: service => {
      if (!service?.walletSelector) return undefined;
      return new NearWalletProvider({ wallet: service.walletSelector });
    },
  }),
  STACKS: defineChain({
    createService: () => StacksXService.getInstance(),
    defaultConnectors: () => STACKS_PROVIDERS.map(c => new StacksXConnector(c)),
    providerManaged: false,
    createWalletProvider: (service, getStore) => {
      const store = getStore();
      const connection = store.xConnections.STACKS;
      const address = connection?.xAccount.address;
      if (!address) return undefined;
      const connector = connection?.xConnectorId
        ? (service.getXConnectorById(connection.xConnectorId) as StacksXConnector | undefined)
        : undefined;
      return new StacksWalletProvider({ address, provider: connector?.getProvider() });
    },
  }),
};

// ─── createChainServices ─────────────────────────────────────────────────────

export const createChainServices = (
  config: ChainsConfig,
  getStore: StoreAccessor,
  rpcConfig?: RpcConfig,
): ChainServicesResult => {
  const xServices: Partial<Record<ChainType, XService>> = {};
  const xConnectorsByChain: Partial<Record<ChainType, XConnector[]>> = {};
  const enabledChains: ChainType[] = [];
  const chainActions: ChainActionsRegistry = {};

  for (const [chainType, factory] of Object.entries(chainRegistry)) {
    const chainConfig = config[chainType as keyof ChainsConfig];
    if (!chainConfig) continue;

    const ct = chainType as ChainType;
    const service = factory.createService(rpcConfig);
    xServices[ct] = service;
    enabledChains.push(ct);

    if (!factory.providerManaged) {
      const configConnectors = (chainConfig as { connectors?: IXConnector[] }).connectors;
      const connectors = configConnectors ? (configConnectors as XConnector[]) : factory.defaultConnectors();
      service.setXConnectors(connectors);
      xConnectorsByChain[ct] = connectors;

      // Register ChainActions for non-provider chains
      chainActions[ct] = factory.createActions
        ? factory.createActions(service, getStore)
        : createDefaultActions(ct, service, getStore);

      // Async connector discovery (Stellar, NEAR) — updates store when done
      if (factory.discoverConnectors) {
        factory.discoverConnectors(service, getStore).catch(err => {
          console.warn(`[wallet-sdk-react] discoverConnectors failed for ${chainType}:`, err);
        });
      }
    }
  }

  return { xServices, xConnectorsByChain, enabledChains, chainActions };
};
