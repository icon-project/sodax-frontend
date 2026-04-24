'use client';

import type { ReactElement } from 'react';

import Image from 'next/image';

export type Exchange = {
  name: string;
  iconSrc: string;
  tradeUrl: string;
  hoverMessage?: string;
  showStatusDot?: boolean;
};

// Only the first (Kraken) and last (SODA Exchange) are real; the 4 middle entries
// are placeholders awaiting final exchange logos and URLs from marketing.
const EXCHANGES: Exchange[] = [
  {
    name: 'Kraken',
    iconSrc: '/exchanges/kraken-white.svg',
    tradeUrl: '#',
    hoverMessage: 'Buy and migrate on Kraken',
    showStatusDot: true,
  },
  {
    name: 'Binance',
    iconSrc: '/exchanges/binance-white.svg',
    tradeUrl: '#',
    hoverMessage: 'Trade ICX ahead of Binance migration',
  },
  {
    name: 'Kraken',
    iconSrc: '/exchanges/kraken-white.svg',
    tradeUrl: '#',
    hoverMessage: 'Trade ICX ahead of Kraken migration',
  },
  {
    name: 'Binance',
    iconSrc: '/exchanges/binance-white.svg',
    tradeUrl: '#',
    hoverMessage: 'Trade ICX ahead of Binance migration',
  },
  {
    name: 'Kraken',
    iconSrc: '/exchanges/kraken-white.svg',
    tradeUrl: '#',
    hoverMessage: 'Trade ICX ahead of Kraken migration',
  },
  {
    name: 'SODA Exchange',
    iconSrc: '/exchanges/soda-symbol-white.svg',
    tradeUrl: '#',
    hoverMessage: 'Buy and migrate on SODA Exchange',
    showStatusDot: true,
  },
];

type ExchangesBarProps = {
  onHoverChange?: (exchange: Exchange | null) => void;
};

export const ExchangesBar = ({ onHoverChange }: ExchangesBarProps): ReactElement => {
  return (
    <div
      className="flex items-center justify-center"
      onMouseLeave={() => onHoverChange?.(null)}
    >
      {EXCHANGES.map((exchange, i) => (
        <div
          key={`${exchange.name}-${i}`}
          onMouseEnter={() => onHoverChange?.(exchange)}
          className="group/exchange px-[3px] sm:px-1 flex items-center justify-center"
        >
          <a
            href={exchange.tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Trade on ${exchange.name}`}
            onFocus={() => onHoverChange?.(exchange)}
            onBlur={() => onHoverChange?.(null)}
            className="relative size-10 sm:size-12 rounded-lg bg-cherry-on-cherry flex items-center justify-center transition-transform group-hover/exchange:scale-105"
          >
            <Image src={exchange.iconSrc} alt="" width={16} height={16} aria-hidden="true" />
            {exchange.showStatusDot && (
              <span
                className="absolute right-1 top-1 size-2 rounded-full bg-cherry-bright"
                aria-hidden="true"
              />
            )}
          </a>
        </div>
      ))}
    </div>
  );
};
