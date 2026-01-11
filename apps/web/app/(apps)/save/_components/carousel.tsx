// apps/web/app/(apps)/save/_components/carousel.tsx
'use client';

import * as React from 'react';
import { Carousel, CarouselContent, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import type { CarouselItemData } from '../page';
import WithdrawDialog from './withdraw-dialog/withdraw-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { CarouselItemContent } from './carousel/carousel-item-content';
interface CarouselWithPaginationProps {
  carouselItems: CarouselItemData[];
  tokenPrices?: Record<string, number>;
  onApiReady?: (api: CarouselApi | undefined) => void;
}

export default function CarouselWithPagination({
  carouselItems,
  tokenPrices,
  onApiReady,
}: CarouselWithPaginationProps): React.JSX.Element {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = React.useState(false);
  const [selectedWithdrawItem, setSelectedWithdrawItem] = React.useState<CarouselItemData | null>(null);
  const isMobile = useIsMobile();
  React.useEffect(() => {
    if (!api) {
      return;
    }

    const updateCount = (): void => {
      const snapListLength = api.scrollSnapList().length;
      setCount(snapListLength);
      setCurrent(api.selectedScrollSnap() + 1);
    };

    updateCount();

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });

    // Listen for reInit event which fires when items change
    api.on('reInit', updateCount);
  }, [api]);

  React.useEffect(() => {
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
          {carouselItems.length > 0 &&
            carouselItems.map((item, index) => (
              <CarouselItemContent
                key={`${item.token.symbol}-${index}`}
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
        {!isMobile && (
          <>
            <CarouselPrevious className="outline-none h-full border-none shadow-none text-clay hover:text-espresso" />
            <CarouselNext className="outline-none h-full border-none shadow-none text-clay hover:text-espresso" />
          </>
        )}
      </Carousel>
      <div className="mt-4 flex items-center justify-start gap-2">
        {Array.from({ length: Math.max(count, carouselItems.length) }).map((_, index) => (
          <button
            type="button"
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn('h-2 w-2 rounded-full bg-cream-white', {
              'bg-yellow-dark': current === index + 1,
            })}
          />
        ))}
      </div>
      <WithdrawDialog
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        selectedItem={selectedWithdrawItem}
      />
    </div>
  );
}
