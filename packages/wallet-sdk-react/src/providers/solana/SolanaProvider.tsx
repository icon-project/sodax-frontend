import type { ReactNode } from 'react';
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import type { RpcConfig } from '@sodax/types';
import type { SolanaChainConfig } from '../../types/config.js';
import { SolanaHydrator } from './SolanaHydrator.js';
import { SolanaActions } from './SolanaActions.js';
import { SOLANA_DEFAULT_AUTO_CONNECT, SOLANA_DEFAULT_RPC_URL } from '../../constants.js';

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
