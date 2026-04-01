'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React from 'react';
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import type { ChainActions } from '../../context/ChainActionsContext';
import type { SuiChainConfig } from '../../types/config';
import { SuiHydrator } from './SuiHydrator';
import { SuiActions } from './SuiActions';

const defaultSuiConfig: Required<Pick<SuiChainConfig, 'autoConnect'>> = {
  autoConnect: true,
};

type SuiProviderProps = {
  children: React.ReactNode;
  config?: SuiChainConfig;
  onRegisterActions: (actions: ChainActions) => void;
};

export const SuiProvider = ({ children, config, onRegisterActions }: SuiProviderProps) => {
  const autoConnect = config?.autoConnect ?? defaultSuiConfig.autoConnect;

  return (
    <SuiClientProvider networks={{ mainnet: { url: getFullnodeUrl('mainnet') } }} defaultNetwork="mainnet">
      <SuiWalletProvider autoConnect={autoConnect}>
        <SuiHydrator />
        <SuiActions onRegisterActions={onRegisterActions} />
        {children}
      </SuiWalletProvider>
    </SuiClientProvider>
  );
};
