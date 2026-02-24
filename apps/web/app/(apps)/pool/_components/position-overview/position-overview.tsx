'use client';

import type React from 'react';
import { useState } from 'react';
import type { EnrichedPosition } from '../../_mocks';
import { usePoolPositions } from '../../_hooks/usePoolPositions';
import { PositionCard } from './position-card';
import { PositionManageModal } from './position-manage-modal';
import { Loader2 } from 'lucide-react';

export function PositionOverview(): React.JSX.Element | null {
  const [managingPosition, setManagingPosition] = useState<EnrichedPosition | null>(null);
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
        <span className="font-['InterRegular'] text-sm text-red-500">
          Failed to load positions
        </span>
      </div>
    );
  }

  if (positions.length === 0) return null;

  const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-['InterRegular'] text-sm text-clay font-medium">Your positions</span>
        <span className="font-['InterRegular'] text-sm text-espresso font-semibold">
          ${totalValue.toFixed(2)}
        </span>
      </div>

      {/* Position cards */}
      <div className="flex flex-col gap-2">
        {positions.map(position => (
          <PositionCard
            key={position.tokenId}
            position={position}
            onManage={setManagingPosition}
          />
        ))}
      </div>

      {/* Manage modal */}
      <PositionManageModal
        position={managingPosition}
        open={managingPosition !== null}
        onOpenChange={open => {
          if (!open) setManagingPosition(null);
        }}
      />
    </div>
  );
}
