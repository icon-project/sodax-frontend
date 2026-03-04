'use client';

import Image from 'next/image';
import type { XToken } from '@sodax/types';
import type { DepositItemData } from '@/constants/save';
import { motion } from 'motion/react';

export default function TotalSaveAssets({
  suppliedAssets,
  onAssetClick,
  totalUsdValue,
}: {
  suppliedAssets: DepositItemData[];
  onAssetClick: (asset: XToken) => void;
  totalUsdValue: string;
}): React.JSX.Element {
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
        ${totalUsdValue}
      </div>
    </div>
  );
}
