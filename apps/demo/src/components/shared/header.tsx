import React from 'react';
import { NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import { WalletModal } from '@/components/shared/wallet-modal';
import { useXAccounts } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { ChevronDown, Wallet } from 'lucide-react';

const navLinks = [
  { to: '/money-market', label: 'Money Market' },
  { to: '/solver', label: 'Solver' },
  { to: '/bridge', label: 'Bridge' },
  { to: '/staking', label: 'Staking' },
];

const getNavLinkClass = (isActive: boolean) =>
  `px-4 py-2 rounded-lg font-medium tracking-wide transition-all ${
    isActive ? 'bg-cherry-brighter text-cherry-dark' : 'text-cream-white hover:bg-cherry-soda hover:text-white'
  }`;

export function NavigationMenu() {
  return (
    <nav className="flex items-center gap-2">
      {navLinks.map(({ to, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) => getNavLinkClass(isActive)}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Header() {
  const { isWalletModalOpen, openWalletModal, closeWalletModal } = useAppStore();
  const xAccounts = useXAccounts();
  const [showChains, setShowChains] = React.useState(false);

  const connectedXAccounts = Object.values(xAccounts).filter(xAccount => xAccount?.address);

  return (
    <header className="bg-cherry-dark border-b border-cherry-soda/20 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {' '}
          <NavigationMenu />
          {connectedXAccounts.length > 0 ? (
            <div className="flex items-center gap-3">
              {/* Custom Dropdown */}
              <div className="relative">
                <Button
                  onClick={() => setShowChains(!showChains)}
                  onBlur={() => setTimeout(() => setShowChains(false), 200)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cherry-bright/20 rounded-lg hover:bg-cherry-soda/30 transition-colors"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-cream-white font-medium">
                    {connectedXAccounts.length} Chain{connectedXAccounts.length > 1 ? 's' : ''}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-cream-white transition-transform ${showChains ? 'rotate-180' : ''}`}
                  />
                </Button>

                {/* Dropdown Content */}
                {showChains && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-cherry-grey/20 p-3 z-50">
                    <h4 className="font-semibold text-sm text-cherry-dark mb-3">Connected Chains</h4>
                    <div className="space-y-2">
                      {connectedXAccounts.map((xAccount, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg bg-cream/50 hover:bg-cream transition-colors"
                        >
                          <div className="w-2 h-2 bg-cherry-soda rounded-full" />
                          <span className="text-sm font-medium text-cherry-dark">{xAccount?.xChainType}</span>
                          {xAccount?.address && (
                            <code className="ml-auto text-xs text-clay font-mono">
                              {xAccount.address.slice(0, 6)}...{xAccount.address.slice(-4)}
                            </code>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={openWalletModal} variant="cherryOutline" size="sm">
                <Wallet className="w-4 h-4" />
                Wallet
              </Button>
            </div>
          ) : (
            <Button onClick={openWalletModal} variant="cherryOutline" size="sm">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      <WalletModal isOpen={isWalletModalOpen} onDismiss={closeWalletModal} />
    </header>
  );
}
