import type React from 'react';
import { useRef } from 'react';
import type { XToken } from '@sodax/types';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { SingleAsset } from './single-asset';
import { MultiAsset } from './multi-asset';

interface TokenAssetProps {
  token?: XToken;
  formattedBalance?: string;
  isHoverDimmed: boolean;
  isHovered: boolean;
  onClick: (e?: React.MouseEvent) => void;
  tokens?: XToken[];
  setSelectNetworkToken: (network: XToken) => void;
  className?: string;
}

export function TokenAsset({
  formattedBalance,
  onClick,
  tokens,
  isHovered,
  isHoverDimmed,
  setSelectNetworkToken,
  className,
}: TokenAssetProps): React.JSX.Element {
  const assetRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={assetRef} className={cn('relative shrink-0', className)}>
        <motion.div
          // layout
          initial={{ opacity: 1, scale: 1 }}
          animate={{ scale: isHovered ? 1.1 : 1, opacity: isHoverDimmed ? 0.5 : 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn('px-3 flex flex-col items-center justify-start cursor-pointer w-18 pb-4 transition-all h-22')}
          data-name="Asset"
          onClick={onClick}
        >
          {tokens && tokens.length > 1 ? (
            <MultiAsset tokens={tokens} setSelectNetworkToken={setSelectNetworkToken} />
          ) : (
            <SingleAsset token={tokens?.[0] || ({} as XToken)} amount={formattedBalance || '0'} />
          )}
        </motion.div>
      </div>
    </>
  );
}
