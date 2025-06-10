'use client';

import type { XChainType, XConfig } from '@/types';
import { useCurrentAccount, useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import React, { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getXService } from '.';
import type { XService } from './core';
import type { XConnection } from './types';
import { ArchwayXConnector, ArchwayXService } from './xchains/archway';
import { EvmXService } from './xchains/evm';
import { HavahHanaXConnector, HavahXConnector, HavahXService } from './xchains/havah';
import { InjectiveKelprXConnector, InjectiveMetamaskXConnector, InjectiveXService } from './xchains/injective';
import { SolanaXService } from './xchains/solana/SolanaXService';
import { useAnchorProvider } from './xchains/solana/hooks/useAnchorProvider';
import { StellarXService } from './xchains/stellar';
import { SuiXService } from './xchains/sui';

type XWagmiStore = {
  xServices: Partial<Record<XChainType, XService>>;
  xConnections: Partial<Record<XChainType, XConnection>>;

  setXConnection: (xChainType: XChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: XChainType) => void;
};

export const useXWagmiStore = create<XWagmiStore>()(
  persist(
    immer((set, get) => ({
      xServices: {},
      xConnections: {},
      setXConnection: (xChainType: XChainType, xConnection: XConnection) => {
        set(state => {
          state.xConnections[xChainType] = xConnection;
        });
      },
      unsetXConnection: (xChainType: XChainType) => {
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
              const xConnector = getXService(xChainType as XChainType).getXConnectorById(xConnection.xConnectorId);
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
    const xChainType = key as XChainType;

    switch (xChainType) {
      case 'EVM':
        if (config[xChainType]) {
          xServices[xChainType] = EvmXService.getInstance();
          xServices[xChainType].setXConnectors([]);
          xServices[xChainType].setConfig(config[xChainType]);
        }
        break;
      case 'ARCHWAY':
        xServices[xChainType] = ArchwayXService.getInstance();
        xServices[xChainType].setXConnectors([new ArchwayXConnector()]);
        break;
      case 'HAVAH':
        xServices[xChainType] = HavahXService.getInstance();
        xServices[xChainType].setXConnectors([new HavahHanaXConnector(), new HavahXConnector()]);
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
      // case 'ICON':
      //   xServices[xChainType] = IconXService.getInstance();
      //   xServices[xChainType].setXConnectors([new IconHanaXConnector()]);
      //   break;
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

  // const { connection: solanaConnection } = useConnection();
  // const solanaWallet = useWallet();
  // const solanaProvider = useAnchorProvider();
  // useEffect(() => {
  //   if (solanaConnection) {
  //     SolanaXService.getInstance().connection = solanaConnection;
  //   }
  // }, [solanaConnection]);
  // useEffect(() => {
  //   if (solanaWallet) {
  //     SolanaXService.getInstance().wallet = solanaWallet;
  //   }
  // }, [solanaWallet]);
  // useEffect(() => {
  //   if (solanaProvider) {
  //     SolanaXService.getInstance().provider = solanaProvider;
  //   }
  // }, [solanaProvider]);

  // const havahXConnection = useXConnection('HAVAH');
  // useEffect(() => {
  //   if (havahXConnection) {
  //     if (havahXConnection.xConnectorId === 'hana') {
  //       // @ts-ignore
  //       havahXService.walletClient = new BalancedJs({ networkId: 0x100, walletProvider: window.hanaWallet.havah });
  //     } else if (havahXConnection.xConnectorId === 'havah') {
  //       // @ts-ignore
  //       havahXService.walletClient = new BalancedJs({ networkId: 0x100, walletProvider: window.havah });
  //     }
  //   }
  // }, [havahXConnection]);
  return <></>;
};
