'use client';

import { useEffect, useState } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Import all SDK packages — catches Turbopack issues at import time
import * as SDK from '@sodax/sdk';
import * as Types from '@sodax/types';
import * as WalletCore from '@sodax/wallet-sdk-core';

// wallet-sdk-react: provider + hooks
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';

// dapp-kit: provider + hooks
import { SodaxProvider } from '@sodax/dapp-kit';

const queryClient = new QueryClient();

// Minimal config matching apps/web
const sodaxConfig: SDK.SodaxConfig = {
  hubProviderConfig: {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: SDK.getHubChainConfig(),
  },
  moneyMarket: SDK.getMoneyMarketConfig(Types.SONIC_MAINNET_CHAIN_ID),
  swaps: {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
    solverApiEndpoint: 'https://api.sodax.com/v1/intent',
  },
};

const rpcConfig: Types.RpcConfig = {
  sonic: 'https://rpc.soniclabs.com',
  '0x1.icon': 'https://ctz.solidwallet.io/api/v3',
  solana: 'https://solana-rpc.publicnode.com',
};

export default function ClientPage() {
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const sdkExports = Object.keys(SDK).length;
    const typesExports = Object.keys(Types).length;
    const walletCoreExports = Object.keys(WalletCore).length;
    const encoded = SDK.encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
    const serialized = SDK.serializeAddressData('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX');

    setResults({
      sdkExports: String(sdkExports),
      typesExports: String(typesExports),
      walletCoreExports: String(walletCoreExports),
      encoded,
      serialized,
      providers: 'ok',
    });
  }, []);

  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider rpcConfig={rpcConfig} options={{ wagmi: { ssr: true } }}>
          <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
            <h1>sodax next16 — client full provider test</h1>
            <p data-testid="sdk-exports">sdkExports: {results.sdkExports ?? 'loading...'}</p>
            <p data-testid="types-exports">typesExports: {results.typesExports ?? 'loading...'}</p>
            <p data-testid="wallet-core-exports">walletCoreExports: {results.walletCoreExports ?? 'loading...'}</p>
            <p data-testid="encoded">encoded: {results.encoded ?? 'loading...'}</p>
            <p data-testid="serialized">serialized: {results.serialized ?? 'loading...'}</p>
            <p data-testid="providers">providers: {results.providers ?? 'loading...'}</p>
          </main>
        </SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
