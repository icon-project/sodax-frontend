import { type ChainType, type RpcConfig, ChainKeys, ChainTypeArr, detectBitcoinAddressType } from '@sodax/types';
import {
  IconWalletProvider,
  InjectiveWalletProvider,
  StellarWalletProvider,
  NearWalletProvider,
  StacksWalletProvider,
} from '@sodax/wallet-sdk-core';
import { Wallet } from '@injectivelabs/wallet-base';
import { getEthereumAddress } from '@injectivelabs/sdk-ts';

import { XConnector, type XService } from './core/index.js';
import type { IWalletProvider, XConnection } from './types/index.js';
import type { IXConnector } from './types/interfaces.js';
import type { ChainsConfig } from './types/config.js';
import type { ChainActions, ChainActionsRegistry } from './types/chainActions.js';

import { EvmXService } from './xchains/evm/index.js';
import { SolanaXService } from './xchains/solana/SolanaXService.js';
import { SuiXService } from './xchains/sui/index.js';
import { StellarXService, StellarWalletsKitXConnector } from './xchains/stellar/index.js';
import type { StellarWalletType } from './xchains/stellar/StellarWalletsKitXConnector.js';
import { IconXService, CHAIN_INFO, SupportedChainId } from './xchains/icon/index.js';
import { IconHanaXConnector } from './xchains/icon/IconHanaXConnector.js';
import { InjectiveXConnector, InjectiveXService } from './xchains/injective/index.js';
import { BitcoinXService } from './xchains/bitcoin/index.js';
import { UnisatXConnector } from './xchains/bitcoin/UnisatXConnector.js';
import { XverseXConnector } from './xchains/bitcoin/XverseXConnector.js';
import { OKXXConnector } from './xchains/bitcoin/OKXXConnector.js';
import { BitcoinXConnector } from './xchains/bitcoin/BitcoinXConnector.js';
import { hasSignBip322, hasSignEcdsa } from './xchains/bitcoin/bitcoinSignGuards.js';
import { NearXService } from './xchains/near/NearXService.js';
import { NearXConnector } from './xchains/near/NearXConnector.js';
import { StacksXService, StacksXConnector, STACKS_PROVIDERS } from './xchains/stacks/index.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Store accessor — avoids circular dependency with useXWalletStore */
export type StoreAccessor = () => {
  xConnections: Partial<Record<ChainType, XConnection>>;
  xServices: Partial<Record<ChainType, XService>>;
  setXConnectors: (xChainType: ChainType, connectors: XConnector[]) => void;
  unsetXConnection: (xChainType: ChainType) => void;
  setWalletProvider: (xChainType: ChainType, provider: IWalletProvider | undefined) => void;
};

export type ChainServiceFactory<S extends XService = XService> = {
  /** Create or get the XService singleton for this chain. */
  createService(rpcConfig?: RpcConfig): S;
  /** Human-readable chain name for display in modal UIs (spec §E of #1123). */
  displayName: string;
  /** Optional icon URL for the chain. Consumers can override when rendering. */
  iconUrl?: string;
  /** Static connectors known at build time. Ignored for provider-managed chains. */
  defaultConnectors(): XConnector[];
  /** true = needs React provider (EVM/Solana/Sui), false = browser extension APIs. */
  providerManaged: boolean;
  /** ChainActions for non-provider chains. If omitted, uses createDefaultActions(). */
  createActions?(service: S, getStore: StoreAccessor): ChainActions;
  /** Wallet provider for non-provider chains. Called on setXConnection(). */
  createWalletProvider?(service: S, getStore: StoreAccessor): IWalletProvider | undefined;
  /**
   * Async connector discovery for chains whose available wallets can only be detected at runtime
   * (e.g. browser extension scan, manifest loading). Runs once after init, updates store.xConnectorsByChain when done.
   * Use when wallet detection requires async operations — if connectors are known statically, use defaultConnectors() instead.
   *
   * Example: Stellar scans for installed browser wallets via walletsKit.getSupportedWallets(),
   * NEAR loads wallet manifest via walletSelector.whenManifestLoaded.
   */
  discoverConnectors?(service: S, getStore: StoreAccessor): Promise<void>;
};

/**
 * Define a chain service factory. Infers `S` from `createService` so all callbacks
 * (createActions, createWalletProvider, discoverConnectors) get the concrete service type,
 * then erases to the base ChainServiceFactory for storage in the registry.
 */
function defineChain<S extends XService>(factory: ChainServiceFactory<S>): ChainServiceFactory {
  return factory;
}

export type ChainServicesResult = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnectorsByChain: Partial<Record<ChainType, IXConnector[]>>;
  enabledChains: ChainType[];
  chainActions: ChainActionsRegistry;
};

// ─── Connector helpers ─────────────────────────────────────────────────────

/**
 * Validate that consumer-supplied connectors (typed against the public
 * `IXConnector` interface) are actual `XConnector` instances. Required at the
 * `BaseChainConfig.connectors` boundary because the SDK stores `XConnector[]`
 * internally — `getXConnectorById` and chain-specific subclass methods rely
 * on the abstract class default behavior.
 */
function narrowConnectors(items: readonly IXConnector[], chainType: ChainType): XConnector[] {
  return items.filter((item): item is XConnector => {
    if (!(item instanceof XConnector)) {
      console.warn(
        `[chainRegistry] ${chainType} connector "${item.id}" must extend XConnector — skipping. Implement the abstract XConnector class instead of raw IXConnector for full SDK support.`,
      );
      return false;
    }
    return true;
  });
}

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
    displayName: 'EVM',
    defaultConnectors: () => [],
    providerManaged: true,
  }),
  SUI: defineChain({
    createService: () => SuiXService.getInstance(),
    displayName: 'Sui',
    defaultConnectors: () => [],
    providerManaged: true,
  }),
  SOLANA: defineChain({
    createService: () => SolanaXService.getInstance(),
    displayName: 'Solana',
    defaultConnectors: () => [],
    providerManaged: true,
  }),
  BITCOIN: defineChain({
    createService: rpcConfig => BitcoinXService.getInstance(rpcConfig?.[ChainKeys.BITCOIN_MAINNET]?.rpcUrl),
    displayName: 'Bitcoin',
    defaultConnectors: () => [new UnisatXConnector(), new XverseXConnector(), new OKXXConnector()],
    providerManaged: false,
    createActions: (service, getStore) => ({
      ...createDefaultActions('BITCOIN', service, getStore),
      signMessage: async (message: string) => {
        const store = getStore();
        const connection = store.xConnections.BITCOIN;
        const connector = connection?.xConnectorId ? service.getXConnectorById(connection.xConnectorId) : undefined;
        if (!(connector instanceof BitcoinXConnector)) {
          throw new Error('Bitcoin wallet not connected');
        }
        const address = connection?.xAccount.address;
        if (!address) throw new Error('Bitcoin address not found');
        const addressType = detectBitcoinAddressType(address);

        switch (addressType) {
          case 'P2WPKH':
          case 'P2TR': {
            if (!hasSignBip322(connector)) {
              throw new Error(`${connector.id} does not support BIP-322 signing`);
            }
            return connector.signBip322Message(message);
          }
          case 'P2SH':
          case 'P2PKH': {
            if (!hasSignEcdsa(connector)) {
              throw new Error(`${connector.id} does not support ECDSA signing`);
            }
            return connector.signEcdsaMessage(message);
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
      const connector = service.getXConnectorById(connection.xConnectorId);
      if (!(connector instanceof BitcoinXConnector)) return undefined;
      return connector.recreateWalletProvider(connection.xAccount);
    },
  }),
  INJECTIVE: defineChain({
    createService: rpcConfig => InjectiveXService.getInstance(rpcConfig?.[ChainKeys.INJECTIVE_MAINNET]),
    displayName: 'Injective',
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
      const stellarRpc = rpcConfig?.[ChainKeys.STELLAR_MAINNET];
      return StellarXService.getInstance(stellarRpc?.horizonRpcUrl, stellarRpc?.sorobanRpcUrl);
    },
    displayName: 'Stellar',
    defaultConnectors: () => [],
    providerManaged: false,
    discoverConnectors: async (service, getStore) => {
      const wallets = await service.walletsKit.getSupportedWallets();
      const connectors = wallets
        .filter((w: StellarWalletType) => w.isAvailable)
        .map((w: StellarWalletType) => new StellarWalletsKitXConnector(w));
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
    createService: rpcConfig => IconXService.getInstance(rpcConfig?.[ChainKeys.ICON_MAINNET] as string | undefined),
    displayName: 'ICON',
    defaultConnectors: () => [new IconHanaXConnector()],
    providerManaged: false,
    createWalletProvider: (_service, getStore) => {
      const address = getStore().xConnections.ICON?.xAccount.address;
      if (!address) return undefined;
      const chainInfo = CHAIN_INFO[SupportedChainId.MAINNET];
      if (!chainInfo) throw new Error('ICON mainnet chain info not found');
      return new IconWalletProvider({
        walletAddress: address as `hx${string}`,
        rpcUrl: chainInfo.APIEndpoint as `http${string}`,
      });
    },
  }),
  NEAR: defineChain({
    createService: rpcConfig => NearXService.getInstance(rpcConfig?.[ChainKeys.NEAR_MAINNET]),
    displayName: 'NEAR',
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
    createService: rpcConfig => StacksXService.getInstance(rpcConfig?.[ChainKeys.STACKS_MAINNET]),
    displayName: 'Stacks',
    defaultConnectors: () => STACKS_PROVIDERS.map(c => new StacksXConnector(c)),
    providerManaged: false,
    createWalletProvider: (service, getStore) => {
      const store = getStore();
      const connection = store.xConnections.STACKS;
      const address = connection?.xAccount.address;
      if (!address) return undefined;
      const connector = connection?.xConnectorId ? service.getXConnectorById(connection.xConnectorId) : undefined;
      const provider = connector instanceof StacksXConnector ? connector.getProvider() : undefined;
      return new StacksWalletProvider({ address, provider });
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
  const xConnectorsByChain: Partial<Record<ChainType, IXConnector[]>> = {};
  const enabledChains: ChainType[] = [];
  const chainActions: ChainActionsRegistry = {};

  for (const chainType of ChainTypeArr) {
    const chainConfig = config[chainType];
    if (!chainConfig) continue;
    const factory = chainRegistry[chainType];
    if (!factory) continue;

    const service = factory.createService(rpcConfig);
    xServices[chainType] = service;
    enabledChains.push(chainType);

    if (!factory.providerManaged) {
      const connectors = chainConfig.connectors
        ? narrowConnectors(chainConfig.connectors, chainType)
        : factory.defaultConnectors();
      service.setXConnectors(connectors);
      xConnectorsByChain[chainType] = connectors;

      // Register ChainActions for non-provider chains
      chainActions[chainType] = factory.createActions
        ? factory.createActions(service, getStore)
        : createDefaultActions(chainType, service, getStore);

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
