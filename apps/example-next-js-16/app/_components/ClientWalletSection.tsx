'use client';

import { useState } from 'react';
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

export default function ClientWalletSection() {
  // Mirror apps/web: connector list mounts only when the user opens the modal,
  // so the initial SSR HTML matches the initial client render (both closed) and
  // browser-only wallet detection happens after mount.
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  return (
    <section data-testid="wallet-section">
      <h2>Wallet Connect — All Networks</h2>
      <button
        type="button"
        onClick={() => setWalletModalOpen((v) => !v)}
        style={{ padding: '8px 16px', cursor: 'pointer' }}
      >
        {walletModalOpen ? 'Close wallets' : 'Open wallets'}
      </button>
      {walletModalOpen && (
        <div
          data-testid="wallet-modal"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          {CHAINS.map((chain) => (
            <ChainSection key={chain} chain={chain} />
          ))}
        </div>
      )}
    </section>
  );
}
