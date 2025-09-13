'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useXConnect, useXConnectors } from '@sodax/wallet-sdk-react';

export default function TestLayout({ children }: { children: ReactNode }) {
  const xConnect = useXConnect();
  const xConnectors = useXConnectors('EVM');
  const handleConnect = async () => {
    const metamask = xConnectors.find(connector => connector.name === 'MetaMask');
    if (!metamask) return;

    await xConnect.mutateAsync(metamask);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Link href="/test/swap">Swap</Link>
        <Link href="/test/migrate">Migrate</Link>
        <Button onClick={handleConnect}>Connect Wallet</Button>
      </div>

      {children}
    </div>
  );
}
