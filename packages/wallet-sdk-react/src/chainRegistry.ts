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

export type ChainServiceFactory = {
  createService: (rpcConfig?: RpcConfig) => XService;
  defaultConnectors: () => XConnector[];
  /** true = connectors hydrated by React provider, not set here */
  providerManaged: boolean;
  /** Create ChainActions for non-provider chains. Provider chains register their own. */
  createActions?: (service: XService, getStore: StoreAccessor) => ChainActions;
  /** Create wallet provider for non-provider chains. Provider chains hydrate their own. */
  createWalletProvider?: (service: XService, getStore: StoreAccessor) => WalletProvider | undefined;
  /**
   * Async connector discovery for chains whose available wallets can only be detected at runtime
   * (e.g. browser extension scan, manifest loading). Runs once after init, updates store.xConnectorsByChain when done.
   * Use when wallet detection requires async operations — if connectors are known statically, use defaultConnectors() instead.
   *
   * Example: Stellar scans for installed browser wallets via walletsKit.getSupportedWallets(),
   * NEAR loads wallet manifest via walletSelector.whenManifestLoaded.
   */
  discoverConnectors?: (service: XService, getStore: StoreAccessor) => Promise<void>;
};

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
  EVM: {
    createService: () => EvmXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: true,
  },
  SUI: {
    createService: () => SuiXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: true,
  },
  SOLANA: {
    createService: () => SolanaXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: true,
  },
  BITCOIN: {
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
        const addressType = address ? detectBitcoinAddressType(address) : undefined;
        // BIP322 signing for P2WPKH and P2TR; ECDSA for legacy (P2SH, P2PKH)
        return addressType === 'P2WPKH' || addressType === 'P2TR'
          ? (
              connector as BitcoinXConnector & { signBip322Message: (msg: string) => Promise<string> }
            ).signBip322Message(message)
          : (connector as BitcoinXConnector & { signEcdsaMessage: (msg: string) => Promise<string> }).signEcdsaMessage(
              message,
            );
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
  },
  INJECTIVE: {
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

        const injectiveService = service as unknown as InjectiveXService;
        const ethereumAddress = getEthereumAddress(address);
        const walletStrategy = injectiveService.walletStrategy;
        const res = await walletStrategy.signArbitrary(
          walletStrategy.getWallet() === Wallet.Metamask ? ethereumAddress : address,
          message,
        );
        if (!res) throw new Error('Injective signature not found');
        return res;
      },
    }),
    createWalletProvider: service => {
      const injectiveService = service as unknown as InjectiveXService;
      if (!injectiveService) return undefined;
      return new InjectiveWalletProvider({ msgBroadcaster: injectiveService.msgBroadcaster });
    },
  },
  STELLAR: {
    createService: rpcConfig => {
      const stellarRpc = rpcConfig?.stellar as StellarRpcConfig | undefined;
      return StellarXService.getInstance(stellarRpc?.horizonRpcUrl, stellarRpc?.sorobanRpcUrl);
    },
    defaultConnectors: () => [],
    providerManaged: false,
    discoverConnectors: async (service, getStore) => {
      const stellarService = service as unknown as StellarXService;
      const wallets = await stellarService.walletsKit.getSupportedWallets();
      const connectors = wallets.filter(w => w.isAvailable).map(w => new StellarWalletsKitXConnector(w));
      stellarService.setXConnectors(connectors);
      getStore().setXConnectors('STELLAR', connectors);
    },
    createActions: (service, getStore) => ({
      ...createDefaultActions('STELLAR', service, getStore),
      signMessage: async (message: string) => {
        const stellarService = service as unknown as StellarXService;
        const res = await stellarService.walletsKit.signMessage(message);
        return res.signedMessage;
      },
    }),
    createWalletProvider: service => {
      const stellarService = service as unknown as StellarXService;
      if (!stellarService?.walletsKit) return undefined;
      return new StellarWalletProvider({
        type: 'BROWSER_EXTENSION',
        walletsKit: stellarService.walletsKit,
        network: 'PUBLIC',
      });
    },
  },
  ICON: {
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
  },
  NEAR: {
    createService: () => NearXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: false,
    discoverConnectors: async (service, getStore) => {
      const nearService = service as unknown as NearXService;
      await nearService.walletSelector.whenManifestLoaded;
      const connectors = nearService.walletSelector.availableWallets.map(w => new NearXConnector(w));
      nearService.setXConnectors(connectors);
      getStore().setXConnectors('NEAR', connectors);
    },
    createActions: (service, getStore) => ({
      ...createDefaultActions('NEAR', service, getStore),
      disconnect: async () => {
        const nearService = service as unknown as NearXService;
        nearService.walletSelector.disconnect();
        getStore().unsetXConnection('NEAR');
      },
    }),
    createWalletProvider: service => {
      const nearService = service as unknown as NearXService;
      if (!nearService?.walletSelector) return undefined;
      return new NearWalletProvider({ wallet: nearService.walletSelector });
    },
  },
  STACKS: {
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
  },
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
        factory.discoverConnectors(service, getStore);
      }
    }
  }

  return { xServices, xConnectorsByChain, enabledChains, chainActions };
};
