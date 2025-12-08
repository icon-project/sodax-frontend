import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import type { WalletItemProps } from './wallet-item';
import WalletItem from './wallet-item';

type WalletModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
};

export const xChainTypes: WalletItemProps[] = [
  {
    name: 'EVM',
    xChainType: 'EVM',
  },
  {
    name: 'Injective',
    xChainType: 'INJECTIVE',
  },
  {
    name: 'Solana',
    xChainType: 'SOLANA',
  },
  {
    name: 'Sui',
    xChainType: 'SUI',
  },
  {
    name: 'Stellar',
    xChainType: 'STELLAR',
  },
  {
    name: 'ICON',
    xChainType: 'ICON',
  },
];

export const WalletModal = ({ isOpen, onDismiss }: WalletModalProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={_ => onDismiss()} modal={false}>
      <SheetContent side={'right'}>
        <VisuallyHidden.Root>
          <SheetTitle>Wallet Modal</SheetTitle>
          <SheetDescription>Wallet Modal</SheetDescription>
        </VisuallyHidden.Root>
        <div className="mt-10 p-4">
          <div className={cn('flex flex-col justify-between', 'h-[calc(100vh-290px)]')}>
            <ScrollArea className="h-full">
              <div className="w-full flex flex-col gap-4 mt-2">
                <Separator className="h-1 bg-[#ffffff59]" />

                {xChainTypes.map(wallet => (
                  <div key={wallet.xChainType} className="flex flex-col gap-4">
                    <WalletItem {...wallet} />
                    <Separator className="h-1 bg-[#ffffff59]" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
