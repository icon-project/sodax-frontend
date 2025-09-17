'use client';

import type { ChainType } from '@sodax/types';
import type { XConfig } from './types';
import { useCurrentAccount, useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import React, { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getXService } from '.';
import type { XService } from './core';
import type { XConnection } from './types';
import { EvmXService } from './xchains/evm';
import { InjectiveKelprXConnector, InjectiveMetamaskXConnector, InjectiveXService } from './xchains/injective';
import { SolanaXService } from './xchains/solana/SolanaXService';
import { StellarXService } from './xchains/stellar';
import { SuiXService } from './xchains/sui';
import { IconXService } from './xchains/icon';
import { IconHanaXConnector } from './xchains/icon/IconHanaXConnector';
import { useAnchorProvider } from './xchains/solana/hooks/useAnchorProvider';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

type XWagmiStore = {
  xServices: Partial<Record<ChainType, XService>>;
  xConnections: Partial<Record<ChainType, XConnection>>;

  setXConnection: (xChainType: ChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: ChainType) => void;
};

export const useXWagmiStore = create<XWagmiStore>()(
  persist(
    immer((set, get) => ({
      xServices: {},
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

      // TODO: better way to handle rehydration of xConnections?
      onRehydrateStorage: state => {
        console.log('hydration starts');

        return (state, error) => {
          if (state?.xConnections) {
            console.log('rehydrating xConnections', state.xConnections);
            Object.entries(state.xConnections).forEach(([xChainType, xConnection]) => {
              const xConnector = getXService(xChainType as ChainType).getXConnectorById(xConnection.xConnectorId);
              xConnector?.connect();
            });
          }
          if (error) {
            console.log('an error happened during hydration', error);
          } else {
            console.log('hydration finished');
          }
        };
      },
    },
  ),
);

const initXServices = (config: XConfig) => {
  const xServices = {};
  Object.keys(config).forEach(key => {
    const xChainType = key as ChainType;

    switch (xChainType) {
      case 'EVM':
        if (config[xChainType]) {
          xServices[xChainType] = EvmXService.getInstance();
          xServices[xChainType].setXConnectors([]);
          xServices[xChainType].setConfig(config[xChainType]);
        }
        break;
      case 'INJECTIVE':
        xServices[xChainType] = InjectiveXService.getInstance();
        xServices[xChainType].setXConnectors([new InjectiveMetamaskXConnector(), new InjectiveKelprXConnector()]);
        break;
      case 'STELLAR':
        xServices[xChainType] = StellarXService.getInstance();
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
      case 'ICON':
        xServices[xChainType] = IconXService.getInstance();
        xServices[xChainType].setXConnectors([new IconHanaXConnector()]);
        break;
      default:
        break;
    }
  });

  return xServices;
};

export const initXWagmiStore = (config: XConfig) => {
  useXWagmiStore.setState({
    xServices: initXServices(config),
  });
};

export const InitXWagmiStore = () => {
  // sui
  const suiClient = useSuiClient();
  useEffect(() => {
    if (suiClient) {
      SuiXService.getInstance().suiClient = suiClient;
    }
  }, [suiClient]);
  const { currentWallet: suiWallet } = useCurrentWallet();
  useEffect(() => {
    if (suiWallet) {
      SuiXService.getInstance().suiWallet = suiWallet;
    }
  }, [suiWallet]);
  const suiAccount = useCurrentAccount();
  useEffect(() => {
    if (suiAccount) {
      SuiXService.getInstance().suiAccount = suiAccount;
    }
  }, [suiAccount]);

  // solana
  const { connection: solanaConnection } = useConnection();
  const solanaWallet = useWallet();
  const solanaProvider = useAnchorProvider();
  useEffect(() => {
    if (solanaConnection) {
      SolanaXService.getInstance().connection = solanaConnection;
    }
  }, [solanaConnection]);
  useEffect(() => {
    if (solanaWallet) {
      SolanaXService.getInstance().wallet = solanaWallet;
    }
  }, [solanaWallet]);
  useEffect(() => {
    if (solanaProvider) {
      SolanaXService.getInstance().provider = solanaProvider;
    }
  }, [solanaProvider]);

  return <></>;
};
