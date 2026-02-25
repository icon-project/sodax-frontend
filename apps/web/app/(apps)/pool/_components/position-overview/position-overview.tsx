'use client';

import type React from 'react';
import { useState } from 'react';
import type { EnrichedPosition } from '../../_mocks';
import { usePoolPositions } from '../../_hooks/usePoolPositions';
import { PositionCardWithData } from './position-card-with-data';
import { PositionManageModal } from './position-manage-modal';
import { Loader2 } from 'lucide-react';

export function PositionOverview(): React.JSX.Element | null {
  const [managingPosition, setManagingPosition] = useState<EnrichedPosition | null>(null);
  const [claimingPosition, setClaimingPosition] = useState<EnrichedPosition | null>(null);
  const activePosition = managingPosition ?? claimingPosition;
  const { positions, isLoading, error } = usePoolPositions();

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-clay" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-4">
        <span className="font-['InterRegular'] text-sm text-red-500">Failed to load positions</span>
      </div>
    );
  }

  if (positions.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-['InterRegular'] text-sm text-clay font-medium">Your positions</span>
        <span className="font-['InterRegular'] text-xs text-clay">
          {positions.length} position{positions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Total liquidity label — value resolved per-card via usePositionInfo enrichment */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="font-['InterRegular'] text-sm text-clay">Your liquidity</span>
      </div>

      {/* Position cards — each resolves its own pool and enriches independently */}
      <div className="flex flex-col gap-2">
        {positions.map(position => (
          <PositionCardWithData
            key={position.tokenId}
            position={position}
            onManage={setManagingPosition}
            onClaim={pos => {
              setClaimingPosition(pos);
              setManagingPosition(pos);
            }}
          />
        ))}
      </div>

      {/* Manage modal — defaultTab='claim' when triggered from card's inline Claim button */}
      <PositionManageModal
        position={activePosition}
        open={activePosition !== null}
        defaultTab={claimingPosition !== null ? 'claim' : 'add'}
        onOpenChange={open => {
          if (!open) {
            setManagingPosition(null);
            setClaimingPosition(null);
          }
        }}
      />
    </div>
  );
}
