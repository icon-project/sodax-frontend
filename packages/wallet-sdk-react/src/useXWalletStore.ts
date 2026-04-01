import type { ChainType } from '@sodax/types';
import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { XService } from './core';
import type { XConnector } from './core';
import type { XConnection } from './types';
import type { ChainActions, ChainActionsRegistry } from './context/ChainActionsContext';
import type { ChainsConfig } from './types/config';
import type { RpcConfig, BitcoinRpcConfig } from '@sodax/types';
import type { IXConnector } from './types/interfaces';
import type { WalletProvider } from './types';
import {
  IconWalletProvider,
  InjectiveWalletProvider,
  StellarWalletProvider,
  NearWalletProvider,
  StacksWalletProvider,
} from '@sodax/wallet-sdk-core';
import { EvmXService } from './xchains/evm';
import { InjectiveXConnector, InjectiveXService } from './xchains/injective';
import { Wallet } from '@injectivelabs/wallet-base';
import { getEthereumAddress } from '@injectivelabs/sdk-ts';
import { SolanaXService } from './xchains/solana/SolanaXService';
import { StellarXService, StellarWalletsKitXConnector } from './xchains/stellar';
import { SuiXService } from './xchains/sui';
import { IconXService, CHAIN_INFO, SupportedChainId } from './xchains/icon';
import { IconHanaXConnector } from './xchains/icon/IconHanaXConnector';
import { BitcoinXService } from './xchains/bitcoin';
import { UnisatXConnector } from './xchains/bitcoin/UnisatXConnector';
import { XverseXConnector } from './xchains/bitcoin/XverseXConnector';
import { OKXXConnector } from './xchains/bitcoin/OKXXConnector';
import { NearXService } from './xchains/near/NearXService';
import { NearXConnector } from './xchains/near/NearXConnector';
import { StacksXService, StacksXConnector, STACKS_PROVIDERS } from './xchains/stacks';
import type { BitcoinXConnector } from './xchains/bitcoin/BitcoinXConnector';

// ─── Chain Registry ──────────────────────────────────────────────────────────

type ChainServiceFactory = {
  createService: (rpcConfig?: RpcConfig) => XService;
  defaultConnectors: () => XConnector[];
  /** true = connectors hydrated by React provider, not set here */
  providerManaged: boolean;
  /** Create ChainActions for non-provider chains. Provider chains register their own. */
  createActions?: (service: XService, getStore: () => XWalletStore) => ChainActions;
  /** Create wallet provider for non-provider chains. Provider chains hydrate their own. */
  createWalletProvider?: (service: XService, getStore: () => XWalletStore) => WalletProvider | undefined;
  /** Async connector discovery — runs after init, updates store when done. */
  discoverConnectors?: (service: XService, getStore: () => XWalletStore) => Promise<void>;
};

/**
 * Helper: creates default ChainActions for non-provider chains.
 * connect/disconnect delegate to XConnector, getConnectors/getConnection read from store.
 */
const createDefaultActions = (chainType: ChainType, service: XService, getStore: () => XWalletStore): ChainActions => ({
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

const chainRegistry: Record<string, ChainServiceFactory> = {
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
    createService: (rpcConfig) => BitcoinXService.getInstance((rpcConfig?.bitcoin as BitcoinRpcConfig | undefined)?.rpcUrl),
    defaultConnectors: () => [new UnisatXConnector(), new XverseXConnector(), new OKXXConnector()],
    providerManaged: false,
    createActions: (service, getStore) => ({
      ...createDefaultActions('BITCOIN', service, getStore),
      signMessage: async (message: string) => {
        const store = getStore();
        const connectorId = store.xConnections.BITCOIN?.xConnectorId;
        const connector = connectorId ? service.getXConnectorById(connectorId) : undefined;
        if (!connector || !('signEcdsaMessage' in connector)) {
          throw new Error('Bitcoin wallet not connected or does not support signMessage');
        }
        return (connector as BitcoinXConnector & { signEcdsaMessage: (msg: string) => Promise<string> }).signEcdsaMessage(message);
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
    createWalletProvider: (service) => {
      const injectiveService = service as unknown as InjectiveXService;
      if (!injectiveService) return undefined;
      return new InjectiveWalletProvider({ msgBroadcaster: injectiveService.msgBroadcaster });
    },
  },
  STELLAR: {
    createService: () => StellarXService.getInstance(),
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
    createWalletProvider: (service) => {
      const stellarService = service as unknown as StellarXService;
      if (!stellarService?.walletsKit) return undefined;
      return new StellarWalletProvider({ type: 'BROWSER_EXTENSION', walletsKit: stellarService.walletsKit, network: 'PUBLIC' });
    },
  },
  ICON: {
    createService: () => IconXService.getInstance(),
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
    createWalletProvider: (service) => {
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
        ? service.getXConnectorById(connection.xConnectorId) as StacksXConnector | undefined
        : undefined;
      return new StacksWalletProvider({ address, provider: connector?.getProvider() });
    },
  },
};

// ─── createChainServices ─────────────────────────────────────────────────────

type ChainServicesResult = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>;
  enabledChains: ChainType[];
  chainActions: ChainActionsRegistry;
};

const createChainServices = (config: ChainsConfig, getStore: () => XWalletStore, rpcConfig?: RpcConfig): ChainServicesResult => {
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

// ─── Store ───────────────────────────────────────────────────────────────────

type XWalletStore = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnections: Partial<Record<ChainType, XConnection>>;
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>;
  enabledChains: ChainType[];
  chainActions: ChainActionsRegistry;
  walletProviders: Partial<Record<ChainType, WalletProvider>>;

  setXConnection: (xChainType: ChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: ChainType) => void;
  setXConnectors: (xChainType: ChainType, connectors: XConnector[]) => void;
  registerChainActions: (xChainType: ChainType, actions: ChainActions) => void;
  setWalletProvider: (xChainType: ChainType, provider: WalletProvider | undefined) => void;
  initChainServices: (config: ChainsConfig, rpcConfig?: RpcConfig) => void;
};

export const useXWalletStore = create<XWalletStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        xServices: {},
        xConnections: {},
        xConnectorsByChain: {},
        enabledChains: [],
        chainActions: {},
        walletProviders: {},

        setXConnection: (xChainType: ChainType, xConnection: XConnection) => {
          set(state => {
            state.xConnections[xChainType] = xConnection;
          });
          // Recreate wallet provider for non-provider chains
          const factory = chainRegistry[xChainType]?.createWalletProvider;
          if (factory) {
            const service = get().xServices[xChainType];
            if (service) {
              const provider = factory(service, () => get());
              get().setWalletProvider(xChainType, provider);
            }
          }
        },

        unsetXConnection: (xChainType: ChainType) => {
          set(state => {
            delete state.xConnections[xChainType];
            delete state.walletProviders[xChainType];
          });
        },

        setXConnectors: (xChainType: ChainType, connectors: XConnector[]) => {
          set(state => {
            state.xConnectorsByChain[xChainType] = connectors;
          });
        },

        registerChainActions: (xChainType: ChainType, actions: ChainActions) => {
          set(state => {
            state.chainActions[xChainType] = actions as never;
          });
        },

        setWalletProvider: (xChainType: ChainType, provider: WalletProvider | undefined) => {
          set(state => {
            if (provider) {
              (state.walletProviders as Record<string, WalletProvider>)[xChainType] = provider;
            } else {
              delete state.walletProviders[xChainType];
            }
          });
        },

        initChainServices: (config: ChainsConfig, rpcConfig?: RpcConfig) => {
          const result = createChainServices(config, () => get(), rpcConfig);
          set(state => {
            state.xServices = { ...state.xServices, ...result.xServices };
            state.xConnectorsByChain = { ...state.xConnectorsByChain, ...result.xConnectorsByChain };
            state.enabledChains = result.enabledChains;
            state.chainActions = { ...state.chainActions, ...result.chainActions } as never;
          });
        },
      })),
      {
        name: 'xwagmi-store',
        storage: createJSONStorage(() => localStorage),
        partialize: state => ({ xConnections: state.xConnections }),
      },
    ),
    { name: 'xwagmi-store' },
  ),
);
