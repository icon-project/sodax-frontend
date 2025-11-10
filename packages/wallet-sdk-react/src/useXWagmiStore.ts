'use client';

import type { ChainType } from '@sodax/types';
import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { XService } from './core';
import type { XConnection } from './types';
import { EvmXService } from './xchains/evm';
import { InjectiveKelprXConnector, InjectiveMetamaskXConnector, InjectiveXService } from './xchains/injective';
import { SolanaXService } from './xchains/solana/SolanaXService';
import { StellarXService } from './xchains/stellar';
import { SuiXService } from './xchains/sui';
import { IconXService } from './xchains/icon';
import { IconHanaXConnector } from './xchains/icon/IconHanaXConnector';
import { NearXService } from './xchains/near/NearXService';

type XWagmiStore = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnections: Partial<Record<ChainType, XConnection>>;

  setXConnection: (xChainType: ChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: ChainType) => void;
};

const initXServices = () => {
  const xServices = {};
  ['EVM', 'INJECTIVE', 'STELLAR', 'SUI', 'SOLANA', 'ICON', 'NEAR'].forEach(key => {
    const xChainType = key as ChainType;

    switch (xChainType) {
      // EVM, SUI, Solana wallet connectors are supported by their own sdks. wagmi, @mysten/dapp-kit, @solana/wallet-adapter-react.
      case 'EVM':
        xServices[xChainType] = EvmXService.getInstance();
        xServices[xChainType].setXConnectors([]);
        break;
      case 'SUI':
        xServices[xChainType] = SuiXService.getInstance();
        xServices[xChainType].setXConnectors([]);
        break;
      case 'SOLANA':
        xServices[xChainType] = SolanaXService.getInstance();
        xServices[xChainType].setXConnectors([]);
        break;

      // Injective, Stellar, Icon wallet connectors are supported by sodax wallet-sdk-react sdk.
      case 'INJECTIVE':
        xServices[xChainType] = InjectiveXService.getInstance();
        xServices[xChainType].setXConnectors([new InjectiveMetamaskXConnector(), new InjectiveKelprXConnector()]);
        break;
      case 'STELLAR':
        xServices[xChainType] = StellarXService.getInstance();
        xServices[xChainType].setXConnectors([]);
        break;
      case 'ICON':
        xServices[xChainType] = IconXService.getInstance();
        xServices[xChainType].setXConnectors([new IconHanaXConnector()]);
        break;
      case 'NEAR':
        xServices[xChainType] = NearXService.getInstance();
        xServices[xChainType].setXConnectors([]);
        break;
      default:
        break;
    }
  });

  return xServices;
};

export const useXWagmiStore = create<XWagmiStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        xServices: initXServices(),
        xConnections: {},
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
