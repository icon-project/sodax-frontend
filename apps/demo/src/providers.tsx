import React, { useMemo, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';
import type { RpcConfig } from '@sodax/types';
import { SodaxProvider } from '@sodax/dapp-kit';
import { productionSolverConfig, stagingSolverConfig, devSolverConfig } from './constants';
import type { SodaxConfig, SolverConfigParams } from '@sodax/sdk';
import { SolverEnv, useAppStore } from './zustand/useAppStore';

const queryClient = new QueryClient();

const rpcConfig: RpcConfig = {
  // evm in dev mode
  sonic: 'https://sonic-rpc.publicnode.com',
  '0xa86a.avax': 'https://avalanche-c-chain-rpc.publicnode.com',
  '0xa4b1.arbitrum': 'https://arbitrum.drpc.org',
  '0x2105.base': 'https://base.drpc.org',
  '0x38.bsc': 'https://bsc.drpc.org',
  '0xa.optimism': 'https://optimism-rpc.publicnode.com',
  '0x89.polygon': 'https://polygon-bor-rpc.publicnode.com',
  ethereum: 'https://ethereum-rpc.publicnode.com',
  hyper: 'https://rpc.hyperliquid.xyz/evm',

  //solana
  //TODO: to be reverted before push! the rpc below isn't working, revert before pushing but we should check
  // solana: process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',

  solana: process.env.SOLANA_RPC_URL ?? process.env.VITE_SOLANA_RPC_URL ?? 'https://solana-rpc.publicnode.com',
  //stellar
  stellar: {
    horizonRpcUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://magical-bitter-frost.stellar-mainnet.quiknode.pro/78709b736890cf5a9bcb36e118b9d18e8ecdb7ee',
  },

  // bitcoin — override radfi endpoints (canary)
  // bitcoin: {
  //   rpcUrl: 'https://mempool.space/signet/api',
  //   radfiApiUrl: 'https://staging.api.radfi.co/api', // https://api.canary.radfi.co/api for prod
  //   radfiUmsUrl: 'https://staging.ums.radfi.co/api', // https://ums.radfi.co/api for prod
  // },
  bitcoin: {
    radfiApiUrl: 'https://api.canary.radfi.co/api',
    radfiUmsUrl: 'https://ums.radfi.co/api'
  },
};

const configMap: Record<SolverEnv, SolverConfigParams> = {
  [SolverEnv.Production]: productionSolverConfig,
  [SolverEnv.Staging]: stagingSolverConfig,
  [SolverEnv.Dev]: devSolverConfig,
};

export default function Providers({ children }: { children: ReactNode }) {
  const { solverEnvironment } = useAppStore();

  const sodaxConfig: SodaxConfig = useMemo(() => {
    return {
      swaps: configMap[solverEnvironment],
    };
  }, [solverEnvironment]);

  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider rpcConfig={rpcConfig}>{children}</SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
