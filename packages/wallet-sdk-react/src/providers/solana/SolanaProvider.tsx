import type { ReactNode } from 'react';
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import type { RpcConfig } from '@sodax/types';
import type { SolanaChainConfig } from '../../types/config';
import { SolanaHydrator } from './SolanaHydrator';
import { SolanaActions } from './SolanaActions';

const defaultSolanaConfig: Required<Pick<SolanaChainConfig, 'autoConnect'>> = {
  autoConnect: true,
};

const emptyWallets: [] = [];

type SolanaProviderProps = {
  children: ReactNode;
  config?: SolanaChainConfig;
  rpcConfig?: RpcConfig;
};

export const SolanaProvider = ({ children, config, rpcConfig }: SolanaProviderProps) => {
  const autoConnect = config?.autoConnect ?? defaultSolanaConfig.autoConnect;
  const endpoint = rpcConfig?.solana ?? 'https://api.mainnet-beta.solana.com';

  return (
    <SolanaConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={emptyWallets} autoConnect={autoConnect}>
        <SolanaHydrator />
        <SolanaActions />
        {children}
      </SolanaWalletProvider>
    </SolanaConnectionProvider>
  );
};
