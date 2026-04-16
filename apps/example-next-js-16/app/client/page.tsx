'use client';

import { useEffect, useState } from 'react';
import * as SDK from '@sodax/sdk';
import * as Types from '@sodax/types';
import * as WalletCore from '@sodax/wallet-sdk-core';
import { useXConnectors, useXConnect, useXAccount, useXDisconnect } from '@sodax/wallet-sdk-react';
import type { ChainType } from '@sodax/types';

const CHAINS: ChainType[] = ['EVM', 'STACKS', 'SOLANA', 'SUI', 'STELLAR', 'NEAR', 'INJECTIVE', 'ICON', 'BITCOIN'];

function ChainSection({ chain }: { chain: ChainType }) {
  const connectors = useXConnectors(chain);
  const account = useXAccount(chain);
  const { mutateAsync: connect, isPending } = useXConnect();
  const disconnect = useXDisconnect();

  return (
    <div style={{ border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
      <h3>{chain}</h3>
      {account.address ? (
        <div>
          <p data-testid={`${chain}-address`} style={{ fontSize: 12, wordBreak: 'break-all' }}>
            {account.address}
          </p>
          <button type="button" onClick={() => disconnect(chain)} style={{ padding: '4px 12px', cursor: 'pointer' }}>
            Disconnect
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {connectors.length === 0 && <span style={{ color: '#999', fontSize: 12 }}>No wallets detected</span>}
          {connectors.map((c) => (
            <button
              type="button"
              key={c.id}
              disabled={isPending}
              onClick={() => connect(c)}
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {c.icon && <img src={c.icon} alt="" width={16} height={16} />}
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

      <hr style={{ margin: '24px 0' }} />
      <h2>Wallet Connect — All Networks</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {CHAINS.map((chain) => (
          <ChainSection key={chain} chain={chain} />
        ))}
      </div>
    </main>
  );
}
