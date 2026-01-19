'use client';

import type React from 'react';
import Link from 'next/link';
import TabIcon, { type TabIconType } from './tab-icon';
import { Badge } from '@/components/ui/badge';

interface RouteTabItemProps {
  href: string;
  value: string;
  type: TabIconType;
  label: string;
  isActive: boolean;
  isMobile?: boolean;
  setRef?: (el: HTMLAnchorElement | null) => void;
  className?: string;
  enabled: boolean;
  badgeCount?: number;
}

const RouteTabItem: React.FC<RouteTabItemProps> = ({
  href,
  value,
  type,
  label,
  isActive,
  isMobile = false,
  setRef,
  className = '',
  enabled,
  badgeCount,
}) => {
  const getTextClassName = (): string => {
    if (isMobile) {
      return `mix-blend-multiply font-normal leading-[1.4] ${
        isActive
          ? "text-espresso text-[13px] leading-[1.4] font-['Shrikhand']"
          : "text-clay font-medium font-['InterRegular'] text-[11px] leading-[1.4]"
      }`;
    }
    return `mix-blend-multiply justify-end leading-snug ${
      isActive
        ? "text-espresso font-['Shrikhand']"
        : !enabled
          ? "text-clay-light font-['InterRegular'] opacity-60"
          : "text-clay font-['InterRegular']"
    }`;
  };

  const getContainerClassName = (): string => {
    if (isMobile) return `flex flex-col items-center gap-2 w-full ${className}`;
    return `inline-flex items-center gap-1 w-33 p-0 ${className}`;
  };

  const content = (
    <div className={getContainerClassName()}>
      <TabIcon type={type} isActive={isActive} isMobile={isMobile} />
      <div className={isMobile ? 'flex justify-start items-center gap-[2px]' : 'flex justify-start items-center ml-2'}>
        <div
          className={getTextClassName()}
          style={!isMobile ? { fontSize: 'var(--body-super-comfortable)' } : undefined}
        >
          {label}
        </div>
        {isMobile && !enabled && (
          <span className="text-clay-light text-[11px] mix-blend-multiply leading-[1.4] font-['InterRegular']">
            (SOON)
          </span>
        )}
        {isMobile && enabled && badgeCount !== undefined && badgeCount > 0 && (
          <Badge
            variant="vibrant"
            className="text-clay font-bold font-['InterRegular'] text-[9px] w-[21px] h-[16px] ml-2"
          >
            {badgeCount}
          </Badge>
        )}
      </div>
      {!isMobile && !enabled && <Badge variant="desktop">SOON</Badge>}
      {!isMobile && enabled && badgeCount !== undefined && badgeCount > 0 && (
        <Badge
          variant="vibrant"
          className="text-clay font-bold font-['InterRegular'] text-[9px] w-[21px] h-[16px] ml-3"
        >
          {badgeCount}
        </Badge>
      )}
    </div>
  );

  if (!enabled) {
    return (
      <div
        ref={setRef ? (el: HTMLDivElement | null) => setRef(el as HTMLAnchorElement | null) : undefined}
        className="cursor-not-allowed py-0 px-0"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      ref={setRef}
      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none py-0 px-0"
    >
      {content}
    </Link>
  );
};

export default RouteTabItem;
