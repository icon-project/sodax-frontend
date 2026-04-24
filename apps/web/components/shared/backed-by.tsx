'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Backer = {
  name: string;
  src: string;
};

const BACKERS: Backer[] = [
  { name: 'Spoon Finance', src: '/backers/spoon-finance-white.svg' },
  { name: 'Binance', src: '/backers/binance-white.svg' },
  { name: 'Hana', src: '/backers/hana-white.svg' },
];

const MARQUEE_REPEATS = 8;
const MARQUEE_SEQUENCE = Array.from({ length: MARQUEE_REPEATS }, () => BACKERS).flat();

export const BackedBy = (): ReactElement => {
  const [activeTouchIndex, setActiveTouchIndex] = useState<number | null>(null);
  const touchBoundaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTouchIndex === null) return;
    const onTouchOutside = (event: TouchEvent) => {
      if (!touchBoundaryRef.current?.contains(event.target as Node)) {
        setActiveTouchIndex(null);
      }
    };
    document.addEventListener('touchstart', onTouchOutside);
    return () => document.removeEventListener('touchstart', onTouchOutside);
  }, [activeTouchIndex]);

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-white font-[InterRegular] text-(length:--body-small) leading-[1.4] text-center">
        Backed by
      </span>
      <div ref={touchBoundaryRef} className="max-w-[480px] overflow-x-clip group/marquee relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[20%] z-10 bg-linear-to-r from-cherry-soda to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[20%] z-10 bg-linear-to-l from-cherry-soda to-transparent" />
        <div
          className="flex w-max animate-marquee"
          style={activeTouchIndex !== null ? { animationPlayState: 'paused' } : undefined}
        >
          {[...MARQUEE_SEQUENCE, ...MARQUEE_SEQUENCE].map((backer, i) => (
            <Tooltip key={`${backer.name}-${i}`} open={activeTouchIndex === i ? true : undefined}>
              <TooltipTrigger asChild>
                <span
                  className="mx-3 shrink-0 opacity-25 hover:opacity-100 transition-opacity duration-300"
                  aria-label={backer.name}
                  onTouchStart={event => {
                    event.preventDefault();
                    setActiveTouchIndex(prev => (prev === i ? null : i));
                  }}
                >
                  <Image src={backer.src} alt="" width={24} height={24} aria-hidden="true" />
                </span>
              </TooltipTrigger>
              <TooltipContent
                variant="bubble"
                side="top"
                sideOffset={16}
                className="h-[54px] items-center gap-2 px-8 py-4 text-(length:--body-comfortable)"
              >
                <span className="flex items-center">{backer.name}</span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};
