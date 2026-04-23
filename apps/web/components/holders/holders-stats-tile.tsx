'use client';

import type { ReactElement, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface HoldersStatsTileProps {
  primary: ReactNode;
  primaryAriaLabel?: string;
  label: ReactNode;
  className?: string;
}

const CONTAINER_CLASS = 'flex flex-col items-center text-center gap-3 px-6 py-4';
const PRIMARY_CLASS =
  "font-['InterBlack'] text-cherry-dark leading-[1] text-[56px] sm:text-[64px] md:text-[72px] tracking-tight";
const LABEL_CLASS =
  "font-['InterRegular'] text-espresso text-(length:--body-super-comfortable) leading-[1.3] max-w-[22ch]";

export default function HoldersStatsTile({
  primary,
  primaryAriaLabel,
  label,
  className,
}: HoldersStatsTileProps): ReactElement {
  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      <div className={PRIMARY_CLASS} aria-label={primaryAriaLabel}>
        {primary}
      </div>
      <div className={LABEL_CLASS}>{label}</div>
    </div>
  );
}
