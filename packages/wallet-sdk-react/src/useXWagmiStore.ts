'use client';

import type { ChainType } from '@sodax/types';
import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { XService } from './core';
import type { XConnection } from './types';
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
import { AleoXService } from './xchains/aleo';
import { StacksXService, StacksXConnector, STACKS_PROVIDERS } from './xchains/stacks';

type XWagmiStore = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnections: Partial<Record<ChainType, XConnection>>;

  setXConnection: (xChainType: ChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: ChainType) => void;
};

const initXServices = () => {
  const xServices = {};
  ['EVM', 'BITCOIN', 'INJECTIVE', 'STELLAR', 'SUI', 'SOLANA', 'ICON', 'NEAR', 'ALEO', 'STACKS'].forEach(key => {
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
      case 'BITCOIN':
        xServices[xChainType] = BitcoinXService.getInstance();
        xServices[xChainType].setXConnectors([new UnisatXConnector(), new XverseXConnector(), new OKXXConnector()]);
        break;

      // Injective, Stellar, Icon wallet connectors are supported by sodax wallet-sdk-react sdk.
      case 'INJECTIVE':
        xServices[xChainType] = InjectiveXService.getInstance();
        xServices[xChainType].setXConnectors([
          // EVM wallets (auto-detected via EIP-6963)
          new InjectiveXConnector('MetaMask', Wallet.Metamask),
          // Cosmos wallets (detected via window globals)
          new InjectiveXConnector('Keplr', Wallet.Keplr),
          new InjectiveXConnector('Leap', Wallet.Leap),
        ]);
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
      case 'ALEO':
        xServices[xChainType] = AleoXService.getInstance();
        xServices[xChainType].setXConnectors([]);
        break;
      case 'STACKS':
        xServices[xChainType] = StacksXService.getInstance();
        xServices[xChainType].setXConnectors(STACKS_PROVIDERS.map(config => new StacksXConnector(config)));
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
