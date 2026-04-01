'use client';

import type { ChainType } from '@sodax/types';
import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { XService } from './core';
import type { XConnector } from './core';
import type { XConnection } from './types';
import type { ChainActions, ChainActionsRegistry } from './context/ChainActionsContext';
import type { ChainsConfig } from './types/config';
import type { IXConnector } from './types/interfaces';
import { EvmXService } from './xchains/evm';
import { InjectiveXConnector, InjectiveXService } from './xchains/injective';
import { Wallet } from '@injectivelabs/wallet-base';
import { getEthereumAddress } from '@injectivelabs/sdk-ts';
import { SolanaXService } from './xchains/solana/SolanaXService';
import { StellarXService } from './xchains/stellar';
import { SuiXService } from './xchains/sui';
import { IconXService } from './xchains/icon';
import { IconHanaXConnector } from './xchains/icon/IconHanaXConnector';
import { BitcoinXService } from './xchains/bitcoin';
import { UnisatXConnector } from './xchains/bitcoin/UnisatXConnector';
import { XverseXConnector } from './xchains/bitcoin/XverseXConnector';
import { OKXXConnector } from './xchains/bitcoin/OKXXConnector';
import { NearXService } from './xchains/near/NearXService';
import { StacksXService, StacksXConnector, STACKS_PROVIDERS } from './xchains/stacks';
import type { BitcoinXConnector } from './xchains/bitcoin/BitcoinXConnector';

// ─── Chain Registry ──────────────────────────────────────────────────────────

type ChainServiceFactory = {
  createService: () => XService;
  defaultConnectors: () => XConnector[];
  /** true = connectors hydrated by React provider, not set here */
  providerManaged: boolean;
  /** Create ChainActions for non-provider chains. Provider chains register their own. */
  createActions?: (service: XService, getStore: () => XWalletStore) => ChainActions;
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
    createService: () => BitcoinXService.getInstance(),
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
  },
  STELLAR: {
    createService: () => StellarXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: false,
    createActions: (service, getStore) => ({
      ...createDefaultActions('STELLAR', service, getStore),
      signMessage: async (message: string) => {
        const stellarService = service as unknown as StellarXService;
        const res = await stellarService.walletsKit.signMessage(message);
        return res.signedMessage;
      },
    }),
  },
  ICON: {
    createService: () => IconXService.getInstance(),
    defaultConnectors: () => [new IconHanaXConnector()],
    providerManaged: false,
  },
  NEAR: {
    createService: () => NearXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: false,
    createActions: (service, getStore) => ({
      ...createDefaultActions('NEAR', service, getStore),
      disconnect: async () => {
        const nearService = service as unknown as NearXService;
        nearService.walletSelector.disconnect();
        getStore().unsetXConnection('NEAR');
      },
    }),
  },
  STACKS: {
    createService: () => StacksXService.getInstance(),
    defaultConnectors: () => STACKS_PROVIDERS.map(c => new StacksXConnector(c)),
    providerManaged: false,
  },
};

// ─── createChainServices ─────────────────────────────────────────────────────

type ChainServicesResult = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>;
  enabledChains: ChainType[];
  chainActions: ChainActionsRegistry;
};

const createChainServices = (config: ChainsConfig, getStore: () => XWalletStore): ChainServicesResult => {
  const xServices: Partial<Record<ChainType, XService>> = {};
  const xConnectorsByChain: Partial<Record<ChainType, XConnector[]>> = {};
  const enabledChains: ChainType[] = [];
  const chainActions: ChainActionsRegistry = {};

  for (const [chainType, factory] of Object.entries(chainRegistry)) {
    const chainConfig = config[chainType as keyof ChainsConfig];
    if (!chainConfig) continue;

    const ct = chainType as ChainType;
    const service = factory.createService();
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

  setXConnection: (xChainType: ChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: ChainType) => void;
  setXConnectors: (xChainType: ChainType, connectors: XConnector[]) => void;
  registerChainActions: (xChainType: ChainType, actions: ChainActions) => void;
  initChainServices: (config: ChainsConfig) => void;
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

        setXConnection: (xChainType: ChainType, xConnection: XConnection) => {
          set(state => {
            state.xConnections[xChainType] = xConnection;
          });
        },

        unsetXConnection: (xChainType: ChainType) => {
          set(state => {
            delete state.xConnections[xChainType];
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

        initChainServices: (config: ChainsConfig) => {
          const result = createChainServices(config, () => get());
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
