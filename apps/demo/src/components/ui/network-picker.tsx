'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { getChainName } from '@/constants';
import type { XToken } from '@sodax/types';
import { Button } from './button';

export function SimpleNetworkPicker({
  isOpen,
  tokens,
  tokenSymbol,
  onSelect,
  reference,
  onClose,
}: {
  isOpen: boolean;
  tokens: XToken[];
  tokenSymbol: string;
  onSelect: (token: XToken) => void;
  reference: HTMLElement | null;
  onClose: () => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate position based on reference element
  useEffect(() => {
    if (!isOpen || !reference) return;

    const updatePosition = () => {
      const rect = reference.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, reference]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        reference &&
        !reference.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, reference]);

  if (!isOpen || !reference) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: reference.offsetWidth,
      }}
    >
      <div className="bg-white border border-cherry-grey/20 rounded-lg shadow-lg p-2">
        <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
          {hoveredIndex !== null && tokens[hoveredIndex]
            ? `${tokenSymbol} on ${getChainName(tokens[hoveredIndex].xChainId)}`
            : 'Select network'}
        </div>

        <div className="space-y-1">
          {tokens.map((token, index) => (
            <Button
              key={token.xChainId}
              type="button"
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors',
                'hover:bg-cherry-brighter/20',
                hoveredIndex === index && 'bg-cherry-brighter/10',
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                onSelect(token);
                onClose();
              }}
            >
              <span className="text-sm">{getChainName(token.xChainId)}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
