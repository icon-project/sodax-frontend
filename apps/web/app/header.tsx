'use client';

import { NavigationMenuDemo } from '@/components/header';
import { Button } from '@/components/ui/button';
import { WalletModal } from '@/components/wallet-modal';
import { useXAccounts } from '@new-world/xwagmi';
import { useState } from 'react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const xAccounts = useXAccounts();

  const connectedXAccounts = Object.values(xAccounts).filter(xAccount => xAccount?.address);

  return (
    <div className="flex justify-between items-center">
      <NavigationMenuDemo />
      {connectedXAccounts.length > 0 ? (
        <div className="flex items-center gap-2">
          <span>{connectedXAccounts.map(xAccount => xAccount?.xChainType).join(',')}</span>
          <Button onClick={() => setIsOpen(true)}>Wallet View</Button>
        </div>
      ) : (
        <Button onClick={() => setIsOpen(true)}>Connect</Button>
      )}

      <WalletModal isOpen={isOpen} onDismiss={() => setIsOpen(false)} />
    </div>
  );
}
