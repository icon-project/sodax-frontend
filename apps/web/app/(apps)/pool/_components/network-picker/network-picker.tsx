import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import NetworkIcon from '@/components/shared/network-icon';
import { chainIdToChainName } from '@/providers/constants';
import type { XToken, SpokeChainId, ChainId } from '@sodax/types';

interface NetworkPickerGridProps {
  supportedChains: { chainId: ChainId; token: XToken }[];
  selectedChainId: ChainId | null;
  onSelect: (chainId: ChainId) => void;
}

export function NetworkPickerGrid({
  supportedChains,
  selectedChainId,
  onSelect,
}: NetworkPickerGridProps): React.JSX.Element {
  const [hoveredChain, setHoveredChain] = useState<ChainId | null>(null);

  return (
    <motion.div
      className="network-picker-container absolute left-0 right-0 top-full mt-4 z-30 flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header text */}
      <div className="font-['InterRegular'] text-(length:--body-small) font-medium text-espresso text-center">
        {hoveredChain ? (
          <>
            Supply{' '}
            <span className="font-bold">on {chainIdToChainName(hoveredChain as SpokeChainId)}</span>
          </>
        ) : (
          'Choose a network'
        )}
      </div>

      {/* Chain grid */}
      <div className="flex flex-wrap justify-center gap-1 max-w-[200px]">
        {supportedChains.map(({ chainId }) => (
          <motion.div
            key={chainId}
            className={cn(
              'p-1.5 cursor-pointer rounded-md transition-colors',
              selectedChainId === chainId && 'ring-2 ring-cherry rounded-md',
              hoveredChain !== null && hoveredChain !== chainId && 'opacity-60 grayscale-[0.5]',
            )}
            whileHover={{ scale: 1.3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onMouseEnter={() => setHoveredChain(chainId)}
            onMouseLeave={() => setHoveredChain(null)}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(chainId);
            }}
          >
            <NetworkIcon id={chainId} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
