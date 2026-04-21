import React, { useMemo, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';
import type { RpcConfig } from '@sodax/types';
import { SodaxProvider } from '@sodax/dapp-kit';
// import { networkFrom } from '@stacks/network';
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
    radfiApiUrl: 'https://api.radfi.co/api',
    radfiUmsUrl: 'https://ums.radfi.co/api',
    rpcUrl: 'https://mempool.space/api',
  },

  // near — single RPC URL
  // near: 'https://free.rpc.fastnear.com',

  // injective — indexer + grpc (fallback to @injectivelabs/networks mainnet defaults)
  // 'injective-1': {
  //   indexer: 'https://your-custom-indexer.injective',
  //   grpc: 'https://your-custom-grpc.injective',
  // },

  // stacks — preset name OR custom StacksNetwork object
  // Option 1: preset name
  // stacks: 'mainnet',
  // Option 2: custom StacksNetwork with baseUrl override (rest from mainnet defaults)
  // stacks: {
  //   ...networkFrom('mainnet'),
  //   client: { baseUrl: 'https://api.hiro.so' },
  // },

  // icon — single RPC URL
  // '0x1.icon': 'https://ctz.solidwallet.io/api/v3',

  // sui — single RPC URL
  // sui: 'https://fullnode.mainnet.sui.io:443',
};

const configMap: Record<SolverEnv, SolverConfigParams> = {
  [SolverEnv.Production]: productionSolverConfig,
  [SolverEnv.Staging]: stagingSolverConfig,
  [SolverEnv.Dev]: devSolverConfig,
};

export default function Providers({ children }: { children: ReactNode }) {
  const { solverEnvironment } = useAppStore();

  const walletConfig = useMemo(() => {
    const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
    const evmConfig: Record<string, unknown> = { ssr: false, reconnectOnMount: true };
    if (wcProjectId) {
      evmConfig.walletConnect = { projectId: wcProjectId };
    }
    return {
      chains: {
        EVM: evmConfig,
        SOLANA: {},
        SUI: {},
        BITCOIN: {},
        ICON: {},
        INJECTIVE: {},
        STELLAR: {},
        NEAR: {},
        STACKS: {},
      },
      rpcConfig,
    };
  }, []);

  const sodaxConfig: SodaxConfig = useMemo(() => {
    return {
      swaps: configMap[solverEnvironment],
    };
  }, [solverEnvironment]);

  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider config={walletConfig}>{children}</SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
