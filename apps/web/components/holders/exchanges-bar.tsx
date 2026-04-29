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

const EXCHANGES: Exchange[] = [
  {
    name: 'Kraken',
    iconSrc: '/exchanges/kraken-white.svg',
    tradeUrl: 'https://www.kraken.com/prices/icon',
    hoverMessage: 'Buy or Migrate ICX on Kraken',
    showStatusDot: false,
  },
  {
    name: 'Binance',
    iconSrc: '/exchanges/binance-white.svg',
    tradeUrl: 'https://www.binance.com/en/trade/ICX_USDT',
    hoverMessage: 'Trade ICX ahead of Binance migration',
  },
  {
    name: 'KuCoin',
    iconSrc: '/exchanges/kucoin-white.svg',
    tradeUrl: 'https://www.kucoin.com/trade/ICX-USDT?QBA4YP4G',
    hoverMessage: 'Trade ICX ahead of KuCoin migration',
  },
  {
    name: 'Upbit',
    iconSrc: '/exchanges/upbit-white.svg',
    tradeUrl: 'https://www.upbit.com/exchange/CRIX.UPBIT.KRW-ICX',
    hoverMessage: 'Trade ICX ahead of Upbit migration',
  },
  {
    name: 'Bithumb',
    iconSrc: '/exchanges/bithumb-white.svg',
    tradeUrl: 'https://www.bithumb.com/react/trade/order/ICX-KRW',
    hoverMessage: 'Trade ICX ahead of Bithumb migration',
  },
  {
    name: 'SODA Exchange',
    iconSrc: '/exchanges/soda-symbol-white.svg',
    tradeUrl: 'https://www.sodax.com/exchange/swap',
    hoverMessage: 'Buy SODA on SODA Exchange',
    showStatusDot: true,
  },
];

type ExchangesBarProps = {
  onHoverChange?: (exchange: Exchange | null) => void;
};

export const ExchangesBar = ({ onHoverChange }: ExchangesBarProps): ReactElement => {
  return (
    <div className="group/exchanges flex items-center justify-center" onMouseLeave={() => onHoverChange?.(null)}>
      {EXCHANGES.map((exchange, i) => (
        <div
          key={`${exchange.name}-${i}`}
          onMouseEnter={() => onHoverChange?.(exchange)}
          className="group/exchange px-[3px] flex items-center justify-center"
        >
          <a
            href={exchange.tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Trade on ${exchange.name}`}
            onFocus={() => onHoverChange?.(exchange)}
            onBlur={() => onHoverChange?.(null)}
            className="relative size-10 sm:size-12 rounded-lg bg-cherry-on-cherry flex items-center justify-center transition-opacity duration-200 opacity-60 group-[&:has(.group\\/exchange:hover)]/exchanges:opacity-40 group-[&:has(.group\\/exchange:focus-within)]/exchanges:opacity-40 group-hover/exchange:opacity-100 group-focus-within/exchange:opacity-100 focus-visible:opacity-100"
          >
            <span className="relative block size-4">
              <Image
                src={exchange.iconSrc}
                alt=""
                fill
                aria-hidden="true"
                className="object-contain transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/exchange:scale-150 group-focus-within/exchange:scale-150"
                sizes="16px"
              />
            </span>
            {exchange.showStatusDot && (
              <span className="absolute right-1 top-1 size-2 rounded-full bg-cherry-bright" aria-hidden="true" />
            )}
          </a>
        </div>
      ))}
    </div>
  );
};
