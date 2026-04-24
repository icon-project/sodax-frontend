'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

type Backer = {
  name: string;
  src: string;
  href: string;
};

const BACKERS: Backer[] = [
  { name: 'Pantera Capital', src: '/backers/pantera-white.svg', href: 'https://panteracapital.com/' },
  { name: 'Kenetic Capital', src: '/backers/kenetic-white.svg', href: 'https://www.kenetic.capital/' },
  { name: 'Blockchange Ventures', src: '/backers/blockchange-white.svg', href: 'https://blockchange.vc/' },
  { name: 'Coinsilium Group', src: '/backers/coinsilium-white.svg', href: 'https://coinsilium.com/' },
  { name: 'Mind Fund Group', src: '/backers/mindfund-white.svg', href: 'https://www.mindfund.com/' },
];

const MARQUEE_REPEATS = 8;
const MARQUEE_SEQUENCE = Array.from({ length: MARQUEE_REPEATS }, () => BACKERS).flat();

export const BackedBy = (): ReactElement => {
  const [isTouchPaused, setIsTouchPaused] = useState(false);
  const touchBoundaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTouchPaused) return;
    const onTouchOutside = (event: TouchEvent) => {
      if (!touchBoundaryRef.current?.contains(event.target as Node)) {
        setIsTouchPaused(false);
      }
    };
    document.addEventListener('touchstart', onTouchOutside);
    return () => document.removeEventListener('touchstart', onTouchOutside);
  }, [isTouchPaused]);

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-white font-[InterRegular] text-(length:--body-small) leading-[1.4] text-center">
        BACKED BY
      </span>
      <div ref={touchBoundaryRef} className="max-w-[480px] overflow-x-clip group/marquee relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[20%] z-10 bg-linear-to-r from-cherry-soda to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[20%] z-10 bg-linear-to-l from-cherry-soda to-transparent" />
        <div
          className="flex w-max animate-marquee [animation-duration:1400s]"
          style={isTouchPaused ? { animationPlayState: 'paused' } : undefined}
        >
          {[...MARQUEE_SEQUENCE, ...MARQUEE_SEQUENCE].map((backer, i) => (
            <a
              key={`${backer.name}-${i}`}
              href={backer.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-3 shrink-0 opacity-25 hover:opacity-100 transition-opacity duration-300"
              aria-label={backer.name}
              onTouchStart={event => {
                // On mobile, first tap pauses the marquee so it’s easier to interact.
                event.preventDefault();
                setIsTouchPaused(prev => !prev);
              }}
            >
              <span className="relative block h-6 w-24">
                <Image src={backer.src} alt="" fill className="object-contain" aria-hidden="true" sizes="96px" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
