'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

import { NETWORK_ICON_MAP } from '@/components/network-icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getNetworkDocsUrl } from '@/lib/docToUrl';

const SUPPORTED_NETWORKS = [
  'Stellar',
  'Near',
  'Avalanche',
  'Polygon',
  'Base',
  'Solana',
  'Sonic',
  'Sui',
  'Optimism',
  'Ethereum',
  'Bitcoin',
  'BNB Chain',
  'HyperEVM',
  'Arbitrum',
  'Kaia',
  'LightLink',
];

type NetworkLogosScrollerProps = {
  clickable?: boolean;
};

export const NetworkLogosScroller = ({ clickable = true }: NetworkLogosScrollerProps): ReactElement => {
  const [activeTouchIndex, setActiveTouchIndex] = useState<number | null>(null);
  const touchBoundaryRef = useRef<HTMLDivElement>(null);
  const touchTriggeredRef = useRef(false);

  // On mobile dismiss tooltip when tapping outside the scroller
  useEffect(() => {
    if (activeTouchIndex === null) return;
    const onTouchOutside = (e: TouchEvent) => {
      if (!touchBoundaryRef.current?.contains(e.target as Node)) {
        setActiveTouchIndex(null);
      }
    };
    document.addEventListener('touchstart', onTouchOutside);
    return () => document.removeEventListener('touchstart', onTouchOutside);
  }, [activeTouchIndex]);

  return (
    <div ref={touchBoundaryRef} className="max-w-[336px] overflow-x-clip group/marquee opacity-60 relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[20%] z-10 bg-linear-to-r from-cherry-soda to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[20%] z-10 bg-linear-to-l from-cherry-soda to-transparent" />
      <div
        className="flex w-max animate-marquee"
        style={activeTouchIndex !== null ? { animationPlayState: 'paused' } : undefined}
      >
        {[...SUPPORTED_NETWORKS, ...SUPPORTED_NETWORKS].map((name, i) => {
          const Icon = NETWORK_ICON_MAP[name];
          if (!Icon) return null;

          const triggerClassName = `mx-3 shrink-0 text-white opacity-40 hover:opacity-100 transition-opacity duration-300${
            clickable ? ' cursor-pointer' : ''
          }`;

          return (
            <Tooltip key={`${name}-${i}`} open={activeTouchIndex === i ? true : undefined}>
              <TooltipTrigger asChild>
                {clickable ? (
                  <a
                    href={getNetworkDocsUrl(name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={triggerClassName}
                    aria-label={`View ${name} documentation`}
                    onTouchStart={e => {
                      touchTriggeredRef.current = true;
                      e.preventDefault();
                      setActiveTouchIndex(prev => (prev === i ? null : i));
                    }}
                    onClick={e => {
                      if (touchTriggeredRef.current) {
                        e.preventDefault();
                        touchTriggeredRef.current = false;
                      }
                    }}
                  >
                    <Icon width={24} height={24} aria-hidden="true" focusable="false" />
                  </a>
                ) : (
                  <span
                    className={triggerClassName}
                    aria-label={name}
                    onTouchStart={e => {
                      e.preventDefault();
                      setActiveTouchIndex(prev => (prev === i ? null : i));
                    }}
                  >
                    <Icon width={24} height={24} aria-hidden="true" focusable="false" />
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent
                variant="bubble"
                side="top"
                sideOffset={16}
                className="h-[54px] items-center gap-2 px-8 py-4 text-(length:--body-comfortable)"
              >
                {clickable ? (
                  <a
                    href={getNetworkDocsUrl(name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    {name}
                  </a>
                ) : (
                  <span className="flex items-center">{name}</span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
