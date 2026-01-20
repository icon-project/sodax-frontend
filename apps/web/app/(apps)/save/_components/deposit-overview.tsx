'use client';

import * as React from 'react';
import { Carousel, CarouselContent, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import type { DepositItemData } from '../page';
import WithdrawDialog from './withdraw-dialog/withdraw-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { DepositItemContent } from './deposit-overview/deposit-item-content';
interface DepositOverviewProps {
  suppliedAssets: DepositItemData[];
  tokenPrices?: Record<string, number>;
  onApiReady?: (api: CarouselApi | undefined) => void;
}

export default function DepositOverview({
  suppliedAssets,
  tokenPrices,
  onApiReady,
}: DepositOverviewProps): React.JSX.Element {
  const [api, setApi] = React.useState<CarouselApi>();
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = React.useState(false);
  const [selectedWithdrawItem, setSelectedWithdrawItem] = React.useState<DepositItemData | null>(null);
  const isMobile = useIsMobile();
  React.useEffect(() => {
    if (!api) {
      return;
    }
    onApiReady?.(api);
  }, [api, onApiReady]);

  return (
    <div className="mx-auto w-full">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: 'start',
          containScroll: false,
        }}
      >
        <CarouselContent className="mix-blend-multiply">
          {suppliedAssets.length > 0 &&
            suppliedAssets.map((item, index) => (
              <DepositItemContent
                key={`${item.asset.symbol}-${index}`}
                item={item}
                tokenPrices={tokenPrices}
                onWithdrawClick={() => {
                  setSelectedWithdrawItem(item);
                  setIsWithdrawDialogOpen(true);
                }}
              />
            ))}
        </CarouselContent>
        {!isMobile && (
          <div className="w-32 h-42 right-0 top-0 absolute bg-gradient-to-l from-[#F5F2F2] to-[rgba(245, 242, 242, 0)] pointer-events-none" />
        )}
        {!isMobile && suppliedAssets.length > 1 && (
          <>
            <CarouselPrevious className="outline-none h-full border-none shadow-none text-clay hover:text-espresso" />
            <CarouselNext className="outline-none h-full border-none shadow-none text-clay hover:text-espresso" />
          </>
        )}
      </Carousel>
      <WithdrawDialog
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        selectedItem={selectedWithdrawItem}
      />
    </div>
  );
}
