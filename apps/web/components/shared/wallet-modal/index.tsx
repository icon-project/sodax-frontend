import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import type { WalletItemProps } from './wallet-item';
import WalletItem from './wallet-item';
import Image from 'next/image';

type WalletModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
};

export const xChainTypes: WalletItemProps[] = [
  {
    name: 'EVM',
    xChainType: 'EVM',
    icon: '/coin/eth1.png',
  },
  {
    name: 'Injective',
    xChainType: 'INJECTIVE',
    icon: '/coin/inj1.png',
  },
  {
    name: 'Solana',
    xChainType: 'SOLANA',
    icon: '/coin/sol.png',
  },
  {
    name: 'Sui',
    xChainType: 'SUI',
    icon: '/coin/sui1.png',
  },
  {
    name: 'Stellar',
    xChainType: 'STELLAR',
    icon: '/coin/ste1.png',
  },
  {
    name: 'ICON',
    xChainType: 'ICON',
    icon: '/coin/icx1.png',
  },
];

export const WalletModal = ({ isOpen, onDismiss }: WalletModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="md:max-w-[480px] p-12 w-[90%] shadow-none bg-white gap-4 h-fit">
        <DialogTitle>
          <div className="self-stretch inline-flex justify-center items-center gap-2">
            <Image src="/symbol.png" alt="SODAX Symbol" width={16} height={16} />
            <div className="flex-1 justify-center text-espresso text-base font-['InterBold'] leading-snug">
              Connect wallets
            </div>
          </div>
        </DialogTitle>
        <div className="self-stretch justify-start text-clay-light text-sm font-medium font-['InterRegular'] leading-tight">
          You will need to connect on both networks
        </div>
        <div className={cn('flex flex-col justify-between', 'h-[calc(100vh-290px)]')}>
          <ScrollArea className="h-full">
            <div className="w-full flex flex-col gap-4 mt-2">
              <Separator className="h-1 bg-clay opacity-30" />
              {xChainTypes.map(wallet => (
                <React.Fragment key={`wallet_${wallet.xChainType}`}>
                  <WalletItem icon={wallet.icon} name={wallet.name} xChainType={wallet.xChainType} />
                  <Separator className="h-1 bg-clay opacity-30" />
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="self-stretch justify-start flex gap-1">
          <span className="text-clay-light text-sm font-medium font-['InterRegular'] leading-tight">
            Need help? Check our guide{' '}
          </span>
          <span className="text-clay-light text-sm font-medium font-['InterRegular'] underline leading-tight">
            here
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
