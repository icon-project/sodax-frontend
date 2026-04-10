'use client';

import { useEffect, useState } from 'react';
import { encodeAddress, serializeAddressData, Sodax, StacksRawSpokeProvider } from '@sodax/sdk';
import { spokeChainConfig, STACKS_MAINNET_CHAIN_ID } from '@sodax/types';
import type { StacksSpokeChainConfig } from '@sodax/types';

// Client component — exercises the Turbopack browser bundle of @sodax/sdk.
// Same tests as SSR page but in client context.
export default function ClientPage() {
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const encoded = encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
    const encodedContract = encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-impl');
    const encodedAddressOnly = encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0');
    const serialized = serializeAddressData('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX');
    const sdk = new Sodax();
    const stacksConfig = spokeChainConfig[STACKS_MAINNET_CHAIN_ID] as StacksSpokeChainConfig;
    const provider = new StacksRawSpokeProvider('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX', stacksConfig);

    setResults({
      encoded,
      encodedContract,
      encodedAddressOnly,
      serialized,
      sdk: sdk ? 'ok' : 'fail',
      provider: provider ? 'ok' : 'fail',
    });
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>sodax next16 — client stacks integration test</h1>
      <p data-testid="encoded">encoded: {results.encoded ?? 'loading...'}</p>
      <p data-testid="encoded-contract">encodedContract: {results.encodedContract ?? 'loading...'}</p>
      <p data-testid="encoded-address-only">encodedAddressOnly: {results.encodedAddressOnly ?? 'loading...'}</p>
      <p data-testid="serialized">serialized: {results.serialized ?? 'loading...'}</p>
      <p data-testid="sdk">sdk: {results.sdk ?? 'loading...'}</p>
      <p data-testid="provider">provider: {results.provider ?? 'loading...'}</p>
    </main>
  );
}
