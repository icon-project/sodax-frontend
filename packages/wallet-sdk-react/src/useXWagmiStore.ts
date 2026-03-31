'use client';

import type { ChainType } from '@sodax/types';
import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { XService } from './core';
import type { XConnector } from './core';
import type { XConnection } from './types';
import type { ChainsConfig } from './types/config';
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
import { reconnectIcon } from './xchains/icon/actions';
import { reconnectInjective } from './xchains/injective/actions';
import { reconnectStellar } from './xchains/stellar/actions';

type ChainServicesResult = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>;
  enabledChains: ChainType[];
};

const createChainServices = (config: ChainsConfig): ChainServicesResult => {
  const xServices: Partial<Record<ChainType, XService>> = {};
  const xConnectorsByChain: Partial<Record<ChainType, XConnector[]>> = {};
  const enabledChains: ChainType[] = [];

  // React SDK chains — init service only, connectors hydrated by providers
  if (config.EVM) {
    xServices.EVM = EvmXService.getInstance();
    enabledChains.push('EVM');
  }
  if (config.SUI) {
    xServices.SUI = SuiXService.getInstance();
    enabledChains.push('SUI');
  }
  if (config.SOLANA) {
    xServices.SOLANA = SolanaXService.getInstance();
    enabledChains.push('SOLANA');
  }

  // Non-provider chains — init service + set connectors
  if (config.BITCOIN) {
    const service = BitcoinXService.getInstance();
    const connectors = config.BITCOIN.connectors ?? [
      new UnisatXConnector(),
      new XverseXConnector(),
      new OKXXConnector(),
    ];
    service.setXConnectors(connectors as XConnector[]);
    xServices.BITCOIN = service;
    xConnectorsByChain.BITCOIN = connectors as XConnector[];
    enabledChains.push('BITCOIN');
  }

  if (config.INJECTIVE) {
    const service = InjectiveXService.getInstance();
    const connectors = config.INJECTIVE.connectors ?? [
      new InjectiveXConnector('MetaMask', Wallet.Metamask),
      new InjectiveXConnector('Keplr', Wallet.Keplr),
      new InjectiveXConnector('Leap', Wallet.Leap),
    ];
    service.setXConnectors(connectors as XConnector[]);
    xServices.INJECTIVE = service;
    xConnectorsByChain.INJECTIVE = connectors as XConnector[];
    enabledChains.push('INJECTIVE');
    reconnectInjective();
  }

  if (config.STELLAR) {
    const service = StellarXService.getInstance();
    const connectors = config.STELLAR.connectors ?? [];
    service.setXConnectors(connectors as XConnector[]);
    xServices.STELLAR = service;
    xConnectorsByChain.STELLAR = connectors as XConnector[];
    enabledChains.push('STELLAR');
    reconnectStellar();
  }

  if (config.ICON) {
    const service = IconXService.getInstance();
    const connectors = config.ICON.connectors ?? [new IconHanaXConnector()];
    service.setXConnectors(connectors as XConnector[]);
    xServices.ICON = service;
    xConnectorsByChain.ICON = connectors as XConnector[];
    enabledChains.push('ICON');
    reconnectIcon();
  }

  if (config.NEAR) {
    const service = NearXService.getInstance();
    const connectors = config.NEAR.connectors ?? [];
    service.setXConnectors(connectors as XConnector[]);
    xServices.NEAR = service;
    xConnectorsByChain.NEAR = connectors as XConnector[];
    enabledChains.push('NEAR');
  }

  if (config.STACKS) {
    const service = StacksXService.getInstance();
    const connectors = config.STACKS.connectors ?? STACKS_PROVIDERS.map(c => new StacksXConnector(c));
    service.setXConnectors(connectors as XConnector[]);
    xServices.STACKS = service;
    xConnectorsByChain.STACKS = connectors as XConnector[];
    enabledChains.push('STACKS');
  }

  return { xServices, xConnectorsByChain, enabledChains };
};

type XWagmiStore = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnections: Partial<Record<ChainType, XConnection>>;
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>;
  enabledChains: ChainType[];

  setXConnection: (xChainType: ChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: ChainType) => void;
  setXConnectors: (xChainType: ChainType, connectors: XConnector[]) => void;
  initChainServices: (config: ChainsConfig) => void;
};

export const useXWagmiStore = create<XWagmiStore>()(
  devtools(
    persist(
      immer((set, get) => ({
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
          const { xServices, xConnectorsByChain, enabledChains } = createChainServices(config);
          set(() => ({ xServices, xConnectorsByChain, enabledChains }));
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
