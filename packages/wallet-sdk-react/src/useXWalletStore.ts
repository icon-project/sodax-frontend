'use client';

import type { ChainType } from '@sodax/types';
import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { XService } from './core';
import type { XConnector } from './core';
import type { XConnection } from './types';
import type { ChainsConfig } from './types/config';
import type { IXConnector } from './types/interfaces';
import { EvmXService } from './xchains/evm';
import { InjectiveXConnector, InjectiveXService } from './xchains/injective';
import { Wallet } from '@injectivelabs/wallet-base';
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

// ─── Chain Registry ──────────────────────────────────────────────────────────

type ChainServiceFactory = {
  createService: () => XService;
  defaultConnectors: () => XConnector[];
  /** true = connectors hydrated by React provider, not set here */
  providerManaged: boolean;
};

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
  },
  INJECTIVE: {
    createService: () => InjectiveXService.getInstance(),
    defaultConnectors: () => [
      new InjectiveXConnector('MetaMask', Wallet.Metamask),
      new InjectiveXConnector('Keplr', Wallet.Keplr),
      new InjectiveXConnector('Leap', Wallet.Leap),
    ],
    providerManaged: false,
  },
  STELLAR: {
    createService: () => StellarXService.getInstance(),
    defaultConnectors: () => [],
    providerManaged: false,
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
};

const createChainServices = (config: ChainsConfig): ChainServicesResult => {
  const xServices: Partial<Record<ChainType, XService>> = {};
  const xConnectorsByChain: Partial<Record<ChainType, XConnector[]>> = {};
  const enabledChains: ChainType[] = [];

  for (const [chainType, factory] of Object.entries(chainRegistry)) {
    const chainConfig = config[chainType as keyof ChainsConfig];
    if (!chainConfig) continue;

    const service = factory.createService();
    xServices[chainType as ChainType] = service;
    enabledChains.push(chainType as ChainType);

    if (!factory.providerManaged) {
      const configConnectors = (chainConfig as { connectors?: IXConnector[] }).connectors;
      const connectors = configConnectors ? (configConnectors as XConnector[]) : factory.defaultConnectors();
      service.setXConnectors(connectors);
      xConnectorsByChain[chainType as ChainType] = connectors;
    }
  }

  return { xServices, xConnectorsByChain, enabledChains };
};

// ─── Store ───────────────────────────────────────────────────────────────────

type XWalletStore = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnections: Partial<Record<ChainType, XConnection>>;
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>;
  enabledChains: ChainType[];

  setXConnection: (xChainType: ChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: ChainType) => void;
  setXConnectors: (xChainType: ChainType, connectors: XConnector[]) => void;
  initChainServices: (config: ChainsConfig) => void;
};

export const useXWalletStore = create<XWalletStore>()(
  devtools(
    persist(
      immer((set) => ({
        xServices: {},
        xConnections: {},
        xConnectorsByChain: {},
        enabledChains: [],

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

        initChainServices: (config: ChainsConfig) => {
          const result = createChainServices(config);
          set(state => {
            state.xServices = { ...state.xServices, ...result.xServices };
            state.xConnectorsByChain = { ...state.xConnectorsByChain, ...result.xConnectorsByChain };
            state.enabledChains = result.enabledChains;
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
