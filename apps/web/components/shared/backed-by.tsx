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
const SCROLL_SPEED_PX_PER_MS = 0.04;

export const BackedBy = (): ReactElement => {
  const [isTouchPaused, setIsTouchPaused] = useState(false);
  const touchBoundaryRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const translateRef = useRef(0);
  const copyWidthRef = useRef(0);
  const isHoveringRef = useRef(false);

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

  useEffect(() => {
    const track = trackRef.current;
    const copy = copyRef.current;
    if (!track || !copy) return;

    const measure = () => {
      copyWidthRef.current = copy.offsetWidth;
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(copy);

    let lastTs = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const dt = now - lastTs;
      lastTs = now;

      const copyWidth = copyWidthRef.current;
      if (copyWidth > 0 && !isTouchPaused && !isHoveringRef.current) {
        translateRef.current -= dt * SCROLL_SPEED_PX_PER_MS;
      }

      if (copyWidth > 0) {
        if (translateRef.current <= -copyWidth) translateRef.current += copyWidth;
        if (translateRef.current > 0) translateRef.current -= copyWidth;
      }

      track.style.transform = `translate3d(${translateRef.current}px, 0, 0)`;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [isTouchPaused]);

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-cherry-brighter font-[InterRegular] text-(length:--body-small) leading-[1.4] text-center">
        BACKED BY
      </span>
      <div
        ref={touchBoundaryRef}
        className="max-w-[480px] overflow-x-clip group/marquee relative"
        onMouseEnter={() => {
          isHoveringRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveringRef.current = false;
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[20%] z-10 bg-linear-to-r from-cherry-soda to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[20%] z-10 bg-linear-to-l from-cherry-soda to-transparent" />
        <div ref={trackRef} className="flex will-change-transform">
          {Array.from({ length: 2 }).map((_, copyIndex) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={copyIndex}
              ref={copyIndex === 0 ? copyRef : undefined}
              className="flex shrink-0"
            >
              {MARQUEE_SEQUENCE.map((backer, i) => (
                <a
                  key={`${copyIndex}-${backer.name}-${i}`}
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
                  <span className="relative block h-4 sm:h-6 w-24">
                    <Image src={backer.src} alt="" fill className="object-contain" aria-hidden="true" sizes="96px" />
                  </span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
