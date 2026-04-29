import { ChainTypeArr, type ChainType, type GetWalletProviderType, type RpcConfig } from '@sodax/types';
import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { XService, XConnector } from './core/index.js';
import type { XConnection, IWalletProvider } from './types/index.js';
import type { ChainActions } from './types/chainActions.js';
import type { ChainsConfig } from './types/config.js';
import { chainRegistry, createChainServices } from './chainRegistry.js';

/** Empty slot in `walletProviders` is normal before a wallet is connected. */
export type GetWalletProviderReturnType<K extends ChainType | undefined> = K extends ChainType
  ? GetWalletProviderType<K> | undefined
  : undefined;

// ─── Store ───────────────────────────────────────────────────────────────────

type XWalletStore = {
  xServices: Partial<Record<ChainType, XService>>;
  /** Active wallet connections. Only field persisted to localStorage. */
  xConnections: Partial<Record<ChainType, XConnection>>;
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>;
  enabledChains: ChainType[];
  chainActions: Partial<Record<ChainType, ChainActions>>;
  /** Wallet providers from wallet-sdk-core. Read by useWalletProvider() hook. */
  walletProviders: Partial<Record<ChainType, IWalletProvider>>;

  setXConnection: (xChainType: ChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: ChainType) => void;
  setXConnectors: (xChainType: ChainType, connectors: XConnector[]) => void;
  registerChainActions: (xChainType: ChainType, actions: ChainActions) => void;
  getWalletProvider: <K extends ChainType | undefined>(xChainType: K) => GetWalletProviderReturnType<K>;
  setWalletProvider: (xChainType: ChainType, provider: IWalletProvider | undefined) => void;
  /** Initialize all chain services from config. Called once by useInitChainServices. */
  initChainServices: (config: ChainsConfig, rpcConfig?: RpcConfig) => void;
  /** Remove persisted connections for chains not in enabledChains. Called after persist hydration. */
  cleanupDisabledConnections: () => void;
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
          // Side-effect: recreate wallet provider for non-provider chains (Bitcoin, ICON, etc.)
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

        setWalletProvider: (xChainType: ChainType, provider: IWalletProvider | undefined) => {
          set(state => {
            if (provider) {
              state.walletProviders[xChainType] = provider;
            } else {
              delete state.walletProviders[xChainType];
            }
          });
        },

        getWalletProvider: <K extends ChainType | undefined>(xChainType: K): GetWalletProviderReturnType<K> => {
          if (!xChainType) return undefined as GetWalletProviderReturnType<K>;
          return get().walletProviders[xChainType] as GetWalletProviderReturnType<K>;
        },

        initChainServices: (config: ChainsConfig, rpcConfig?: RpcConfig) => {
          const result = createChainServices(config, () => get(), rpcConfig);
          set(state => {
            state.xServices = result.xServices;
            state.enabledChains = result.enabledChains;
            // Merge connectors and chainActions — provider-managed chains (EVM/Solana/Sui)
            // hydrate these via their Hydrator/Actions components, which may run before
            // or after this effect due to React's bottom-up effect ordering.
            Object.assign(state.xConnectorsByChain, result.xConnectorsByChain);
            Object.assign(state.chainActions, result.chainActions);
          });
        },

        cleanupDisabledConnections: () => {
          set(state => {
            for (const chainType of ChainTypeArr) {
              if (state.xConnections[chainType] && !state.enabledChains.includes(chainType)) {
                delete state.xConnections[chainType];
                delete state.walletProviders[chainType];
              }
            }
          });
        },
      })),
      {
        // key kept as 'xwagmi-store' for backward compat — existing users won't lose persisted connections on upgrade
        name: 'xwagmi-store',
        storage: createJSONStorage(() => localStorage),
        partialize: state => ({ xConnections: state.xConnections }),
      },
    ),
    { name: 'xwagmi-store' },
  ),
);
