import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider, type SodaxWalletConfig } from '@sodax/wallet-sdk-react';
import type { RpcConfig } from '@sodax/types';

const queryClient = new QueryClient();

const rpcConfig: RpcConfig = {
  sonic: 'https://sonic-rpc.publicnode.com',
  '0xa86a.avax': 'https://avalanche-c-chain-rpc.publicnode.com',
  '0xa4b1.arbitrum': 'https://arbitrum.drpc.org',
  '0x2105.base': 'https://base.drpc.org',
  '0x38.bsc': 'https://bsc.drpc.org',
  '0xa.optimism': 'https://optimism-rpc.publicnode.com',
  '0x89.polygon': 'https://polygon-bor-rpc.publicnode.com',
  ethereum: 'https://ethereum-rpc.publicnode.com',
  hyper: 'https://rpc.hyperliquid.xyz/evm',
  solana: 'https://solana-rpc.publicnode.com',
  stellar: {
    horizonRpcUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://soroban-mainnet.stellar.org',
  },
  bitcoin: {
    radfiApiUrl: 'https://api.radfi.co/api',
    radfiUmsUrl: 'https://ums.radfi.co/api',
    rpcUrl: 'https://mempool.space/api',
  },
};

const walletConfig: SodaxWalletConfig = {
  chains: {
    EVM: { ssr: false, reconnectOnMount: true },
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

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SodaxWalletProvider config={walletConfig}>{children}</SodaxWalletProvider>
    </QueryClientProvider>
  );
}
