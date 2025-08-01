import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { WalletItemProps } from './wallet-item';
import WalletItem from './wallet-item';

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
  {
    name: 'Havah',
    xChainType: 'HAVAH',
  },
];

export default function WalletsPage() {
  return (
    <div className="mt-10 p-4">
      <div className={cn('flex flex-col justify-between', 'h-[calc(100vh-290px)]')}>
        <ScrollArea className="h-full">
          <div className="w-full flex flex-col gap-4 mt-2">
            <Separator className="h-1 bg-[#ffffff59]" />

            {xChainTypes.map(wallet => (
              <>
                <WalletItem key={`wallet_${wallet.xChainType}`} {...wallet} />
                <Separator key={`wallet_${wallet.xChainType}_separator`} className="h-1 bg-[#ffffff59]" />
              </>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
