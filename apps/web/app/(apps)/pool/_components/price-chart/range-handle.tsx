'use client';

import type React from 'react';
import { useCallback, useRef } from 'react';

interface RangeHandleProps {
  /** Y position in pixels (from top of container) */
  y: number;
  /** Percentage from current price (e.g., +21.76 or -17.62) */
  percentage: string;
  /** Whether this is the upper (max) or lower (min) handle */
  variant: 'upper' | 'lower';
  /** Called during drag with new Y position */
  onDrag: (y: number) => void;
  /** Called when drag ends */
  onDragEnd: () => void;
  /** Container height for clamping */
  containerHeight: number;
  /** Whether the handle is visible (valid position) */
  visible: boolean;
}

export function RangeHandle({
  y,
  percentage,
  variant,
  onDrag,
  onDragEnd,
  containerHeight,
  visible,
}: RangeHandleProps): React.JSX.Element | null {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startPos = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = true;
      startY.current = e.clientY;
      startPos.current = y;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [y],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const delta = e.clientY - startY.current;
      const newY = Math.max(0, Math.min(containerHeight, startPos.current + delta));
      onDrag(newY);
    },
    [containerHeight, onDrag],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      onDragEnd();
    },
    [onDragEnd],
  );

  if (!visible) return null;

  const isPositive = !percentage.startsWith('-');

  return (
    <div
      className="absolute left-0 right-8 z-10 pointer-events-none"
      style={{ top: `${y}px`, transform: 'translateY(-50%)' }}
    >
      {/* Dashed line across chart area */}
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-clay/40" />

      {/* Handle: pill + circular grip */}
      <div
        className="absolute right-0 flex items-center gap-1 pointer-events-auto cursor-ns-resize select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Percentage bubble */}
        <div className="px-2 py-0.5 rounded-full bg-white shadow-sm">
          <span className="font-['InterRegular'] text-[11px] font-medium text-espresso whitespace-nowrap">
            {isPositive ? '+' : ''}{percentage}%
          </span>
        </div>
        {/* Circular grip handle */}
        <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
          <div className="flex flex-col gap-[3px]">
            <div className="w-3 h-[1px] bg-clay/60" />
            <div className="w-3 h-[1px] bg-clay/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
