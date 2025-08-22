// apps/web/components/shared/connected-chains-display.tsx
import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useXAccounts } from '@sodax/wallet-sdk';
import { getChainIconByName } from '@/constants/chains';

interface ConnectedChainsDisplayProps {
  onClick?: () => void;
}

export function ConnectedChainsDisplay({ onClick }: ConnectedChainsDisplayProps): React.JSX.Element {
  const xAccounts = useXAccounts();
  const connectedChains = Object.entries(xAccounts)
    .filter(([_, account]) => account?.address)
    .map(([chainType, account]) => ({
      chainType,
      address: account?.address,
      icon: getChainIconByName(chainType),
    }));

  if (connectedChains.length === 0) return <></>;

  return (
    <div className="flex justify-center gap-4 w-[183px]">
      <div className="flex items-center cursor-pointer" onClick={onClick}>
        {connectedChains.map(chain => (
          <div key={chain.chainType} className="relative">
            <Image
              className="rounded shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.20)] outline outline-3 outline-white"
              src={chain.chainType === 'EVM' ? '/coin/s1.png' : chain.icon || ''}
              alt={chain.chainType}
              width={20}
              height={20}
            />
          </div>
        ))}
      </div>
      <Button
        variant="cherry"
        className="w-10 h-10 p-3 bg-cherry-bright rounded-[256px] inline-flex justify-center items-center gap-2 cursor-pointer"
        aria-label="Settings"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}
