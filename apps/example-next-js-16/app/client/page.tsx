'use client';

import { useEffect, useState } from 'react';
import * as SDK from '@sodax/sdk';
import * as Types from '@sodax/types';

// Client component — exercises the Turbopack browser bundle.
// Full namespace import catches any scope-hoisting cycle in client context.
export default function ClientPage() {
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const sdkExports = Object.keys(SDK).length;
    const typesExports = Object.keys(Types).length;
    const encoded = SDK.encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
    const encodedContract = SDK.encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-impl');
    const encodedAddressOnly = SDK.encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0');
    const serialized = SDK.serializeAddressData('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX');
    const sdk = new SDK.Sodax();
    const stacksConfig = Types.spokeChainConfig[Types.STACKS_MAINNET_CHAIN_ID] as Types.StacksSpokeChainConfig;
    const provider = new SDK.StacksRawSpokeProvider('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX', stacksConfig);

    setResults({
      sdkExports: String(sdkExports),
      typesExports: String(typesExports),
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
      <h1>sodax next16 — client SDK integration test</h1>
      <p data-testid="sdk-exports">sdkExports: {results.sdkExports ?? 'loading...'}</p>
      <p data-testid="types-exports">typesExports: {results.typesExports ?? 'loading...'}</p>
      <p data-testid="encoded">encoded: {results.encoded ?? 'loading...'}</p>
      <p data-testid="encoded-contract">encodedContract: {results.encodedContract ?? 'loading...'}</p>
      <p data-testid="encoded-address-only">encodedAddressOnly: {results.encodedAddressOnly ?? 'loading...'}</p>
      <p data-testid="serialized">serialized: {results.serialized ?? 'loading...'}</p>
      <p data-testid="sdk">sdk: {results.sdk ?? 'loading...'}</p>
      <p data-testid="provider">provider: {results.provider ?? 'loading...'}</p>
    </main>
  );
}
