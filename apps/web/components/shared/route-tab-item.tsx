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
}) => {
  // const isSoon = value !== 'migrate' && value !== 'swap';
  const isSoon = false;

  const getTextClassName = (): string => {
    if (isMobile) {
      return `mix-blend-multiply font-normal leading-[1.4] ${
        isActive
          ? "text-espresso text-[13px] leading-[1.4] font-['Shrikhand']"
          : // : isSoon
            //   ? "text-clay-light font-medium font-['InterRegular'] text-[11px] leading-[1.4] opacity-60"
            "text-clay font-medium font-['InterRegular'] text-[11px] leading-[1.4]"
      }`;
    }
    return `mix-blend-multiply justify-end leading-snug ${
      isActive
        ? "text-espresso font-['Shrikhand']"
        : isSoon
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
        {isMobile && isSoon && (
          <span className="text-clay-light text-[11px] mix-blend-multiply leading-[1.4] font-['InterRegular']">
            (SOON)
          </span>
        )}
      </div>
      {!isMobile && isSoon && <Badge variant="desktop">SOON</Badge>}
    </div>
  );

  // Render as non-clickable div for "soon" apps
  if (isSoon) {
    return (
      <div
        ref={setRef ? (el: HTMLDivElement | null) => setRef(el as HTMLAnchorElement | null) : undefined}
        className="cursor-not-allowed py-0 px-0"
      >
        {content}
      </div>
    );
  }

  // Render as clickable Link for available apps
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
