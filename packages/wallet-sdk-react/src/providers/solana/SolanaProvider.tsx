import { type ReactNode, useMemo } from 'react';
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import type { RpcConfig } from '@sodax/types';
import type { SolanaChainConfig } from '../../types/config';
import { SolanaHydrator } from './SolanaHydrator';
import { SolanaActions } from './SolanaActions';

const defaultSolanaConfig: Required<Pick<SolanaChainConfig, 'autoConnect'>> = {
  autoConnect: true,
};

type SolanaProviderProps = {
  children: ReactNode;
  config?: SolanaChainConfig;
  rpcConfig?: RpcConfig;
};

export const SolanaProvider = ({ children, config, rpcConfig }: SolanaProviderProps) => {
  const autoConnect = config?.autoConnect ?? defaultSolanaConfig.autoConnect;
  const endpoint = rpcConfig?.solana ?? 'https://api.mainnet-beta.solana.com';
  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);

  return (
    <SolanaConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={autoConnect}>
        <SolanaHydrator />
        <SolanaActions />
        {children}
      </SolanaWalletProvider>
    </SolanaConnectionProvider>
  );
};
