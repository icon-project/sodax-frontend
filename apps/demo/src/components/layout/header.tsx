import React from 'react';
import { NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import { WalletModal } from '@/components/wallet-modal';
import { useXAccounts } from '@new-world/xwagmi';
import { useState } from 'react';

export function NavigationMenu() {
  return (
    <nav className="flex items-center gap-4">
      <NavLink
        to="/money-market"
        className={({ isActive }) =>
          `text-sm font-medium transition-colors hover:text-primary ${
            isActive ? 'text-primary' : 'text-muted-foreground'
          }`
        }
      >
        Dashboard
      </NavLink>
      {/* <NavLink 
        to="/markets"
        className={({ isActive }) => 
          `text-sm font-medium transition-colors hover:text-primary ${
            isActive ? 'text-primary' : 'text-muted-foreground'
          }`
        }
      >
          Markets
      </NavLink> */}
      <NavLink
        to="/solver"
        className={({ isActive }) =>
          `text-sm font-medium transition-colors hover:text-primary ${
            isActive ? 'text-primary' : 'text-muted-foreground'
          }`
        }
      >
        Solver
      </NavLink>
    </nav>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const xAccounts = useXAccounts();

  const connectedXAccounts = Object.values(xAccounts).filter(xAccount => xAccount?.address);

  return (
    <div className="flex justify-between items-center p-4">
      <NavigationMenu />
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
