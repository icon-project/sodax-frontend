import type { ReactNode } from 'react';
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import type { RpcConfig } from '@sodax/types';
import type { SolanaChainConfig } from '../../types/config';
import { SolanaHydrator } from './SolanaHydrator';
import { SolanaActions } from './SolanaActions';
import { SOLANA_DEFAULT_AUTO_CONNECT, SOLANA_DEFAULT_RPC_URL } from '../../constants';

const emptyWallets: [] = [];

type SolanaProviderProps = {
  children: ReactNode;
  config?: SolanaChainConfig;
  rpcConfig?: RpcConfig;
};

export const SolanaProvider = ({ children, config, rpcConfig }: SolanaProviderProps) => {
  const autoConnect = config?.autoConnect ?? SOLANA_DEFAULT_AUTO_CONNECT;
  const endpoint = rpcConfig?.solana ?? SOLANA_DEFAULT_RPC_URL;

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
