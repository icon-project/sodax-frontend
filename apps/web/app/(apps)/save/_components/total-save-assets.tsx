'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import BigNumber from 'bignumber.js';
import type { XToken } from '@sodax/types';
import type { DepositItemData } from '../page';
import { motion } from 'motion/react';

export default function TotalSaveAssets({
  suppliedAssets,
  onAssetClick,
}: {
  suppliedAssets: DepositItemData[];
  onAssetClick: (asset: XToken) => void;
}): React.JSX.Element {
  const totalUsdValue = useMemo((): string => {
    if (suppliedAssets.length === 0) {
      return '$0.00';
    }

    let total = new BigNumber(0);

    suppliedAssets.forEach(item => {
      const numericValue = item.fiatValue.replace(/[$,]/g, '');
      const value = Number(numericValue);
      if (!Number.isNaN(value) && value > 0) {
        total = total.plus(value);
      }
    });

    const formatted = total.toFixed(2);
    return `$${Number(formatted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [suppliedAssets]);

  return (
    <div className="w-full flex gap-2 justify-start">
      <div className="text-(length:--body-super-comfortable) font-['InterRegular'] text-clay">Total savings</div>
      <motion.div
        className="flex items-center"
        initial={{ gap: '-0.25rem' }}
        whileHover={{ gap: '0.25rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {suppliedAssets.length > 0 ? (
          suppliedAssets.map((item, index) => {
            return (
              <Image
                key={`${item.asset.symbol}-${item.asset.xChainId}-${index}`}
                src={`/coin/${item.asset.symbol === 'bnUSD (legacy)' ? 'bnusd' : item.asset.symbol.toLowerCase()}.png`}
                alt={item.asset.symbol}
                width={20}
                height={20}
                className="rounded-full outline-2 outline-white shrink-0 bg-white cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onAssetClick(item.asset)}
              />
            );
          })
        ) : (
          <div className="w-5 h-5 rounded-full bg-clay-light shrink-0" />
        )}
      </motion.div>
      <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular']">
        {totalUsdValue}
      </div>
    </div>
  );
}
