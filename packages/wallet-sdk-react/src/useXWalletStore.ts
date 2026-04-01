import type { ChainType, RpcConfig } from '@sodax/types';
import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { XService, XConnector } from './core';
import type { XConnection, WalletProvider } from './types';
import type { ChainActions } from './context/ChainActionsContext';
import type { ChainsConfig } from './types/config';
import { chainRegistry, createChainServices } from './chainRegistry';

// ─── Store ───────────────────────────────────────────────────────────────────

type XWalletStore = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnections: Partial<Record<ChainType, XConnection>>;
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>;
  enabledChains: ChainType[];
  chainActions: Record<string, ChainActions>;
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
            state.chainActions[xChainType] = actions;
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
            state.chainActions = { ...state.chainActions, ...result.chainActions };
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
