'use client';

import { useEffect, useState } from 'react';
import * as SDK from '@sodax/sdk';
import * as Types from '@sodax/types';
import * as WalletCore from '@sodax/wallet-sdk-core';

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
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>sodax next16 — client full provider test</h1>
      <p data-testid="sdk-exports">sdkExports: {results.sdkExports ?? 'loading...'}</p>
      <p data-testid="types-exports">typesExports: {results.typesExports ?? 'loading...'}</p>
      <p data-testid="wallet-core-exports">walletCoreExports: {results.walletCoreExports ?? 'loading...'}</p>
      <p data-testid="encoded">encoded: {results.encoded ?? 'loading...'}</p>
      <p data-testid="serialized">serialized: {results.serialized ?? 'loading...'}</p>
      <p data-testid="providers">providers: {results.providers ?? 'loading...'}</p>
    </main>
  );
}
