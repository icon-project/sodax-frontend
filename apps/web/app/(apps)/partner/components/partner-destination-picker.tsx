'use client';

import { useState } from 'react';
import type { XToken, SpokeChainId } from '@sodax/types';
import { TokenAsset } from '@/components/shared/token-asset';

interface PartnerDestinationPickerProps {
  availableChains: XToken[]; // same token, different chains
  selectedChainId: SpokeChainId;
  onChange: (token: XToken) => void;
  onOpenChange?: (open: boolean) => void; //
}

export function PartnerDestinationPicker({
  availableChains,
  selectedChainId,
  onChange,
  onOpenChange,
}: PartnerDestinationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (availableChains.length === 0) return null;

  const fallbackToken = availableChains[0] as XToken;
  const selectedToken = availableChains.find(t => t.xChainId === selectedChainId) ?? fallbackToken;

  return (
    <div className="relative inline-block">
      {/* MAIN CLICK TARGET */}
      <TokenAsset
        name={selectedToken.symbol}
        token={selectedToken}
        isHoldToken={false}
        isGroup
        tokenCount={availableChains.length}
        tokens={availableChains}
        isClicked={isOpen}
        isHoverDimmed={false}
        isClickBlurred={false}
        isHovered={false}
        onClick={() => {
          setIsOpen(prev => {
            const next = !prev;
            onOpenChange?.(next); // SAME VALUE
            return next;
          });
        }}
        onChainClick={token => {
          onChange(token);
          setIsOpen(false);
          onOpenChange?.(false);
        }}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />
    </div>
  );
}
