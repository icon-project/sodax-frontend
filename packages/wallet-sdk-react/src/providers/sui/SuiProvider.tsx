import type { ReactNode } from 'react';
import type { RpcConfig } from '@sodax/types';
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import type { SuiChainConfig } from '../../types/config';
import { SuiHydrator } from './SuiHydrator';
import { SuiActions } from './SuiActions';
import { SUI_DEFAULT_AUTO_CONNECT, SUI_DEFAULT_NETWORK } from '../../constants';

type SuiProviderProps = {
  children: ReactNode;
  config?: SuiChainConfig;
  rpcConfig?: RpcConfig;
};

export const SuiProvider = ({ children, config, rpcConfig }: SuiProviderProps) => {
  const autoConnect = config?.autoConnect ?? SUI_DEFAULT_AUTO_CONNECT;
  const network = config?.network ?? SUI_DEFAULT_NETWORK;
  const rpcUrl = config?.rpcUrl ?? (rpcConfig?.sui as string | undefined) ?? getFullnodeUrl(network);

  return (
    <SuiClientProvider networks={{ [network]: { url: rpcUrl } }} defaultNetwork={network}>
      <SuiWalletProvider autoConnect={autoConnect}>
        <SuiHydrator />
        <SuiActions />
        {children}
      </SuiWalletProvider>
    </SuiClientProvider>
  );
};
