import type React from 'react';
import type { XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import { motion } from 'motion/react';

interface TokenAssetProps {
  name: string;
  token: XToken;
  isClickBlurred: boolean;
  isHoverDimmed: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function TokenAsset({
  name,
  token,
  isClickBlurred,
  isHoverDimmed,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: TokenAssetProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isHoverDimmed ? 0.5 : 1,
        scale: isHovered ? 1.1 : 1,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`px-2 flex flex-col gap-2 items-center justify-start relative cursor-pointer shrink-0 transition-all duration-200 ${
        isClickBlurred ? 'blur filter opacity-30' : isHoverDimmed ? 'opacity-50' : ''
      }`}
      data-name="Asset"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <div className="relative">
        <CurrencyLogo currency={token} />
      </div>
      <div className="relative h-6 w-full">
        <div
          className={`font-['InterRegular'] leading-[0] absolute inset-0 flex items-center justify-center text-(length:--body-small) transition-all duration-200 ${
            isHovered ? 'opacity-100 text-espresso font-bold' : 'opacity-100 text-clay font-medium'
          }`}
        >
          {name}
        </div>
      </div>
    </motion.div>
  );
}
