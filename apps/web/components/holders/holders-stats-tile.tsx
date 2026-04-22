'use client';

import type { ReactElement, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface HoldersStatsTileProps {
  eyebrow: string;
  headline: ReactNode;
  headlineAriaLabel?: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const CONTAINER_CLASS =
  'w-full bg-almost-white mt-4 flex flex-col items-center justify-center text-center px-6 py-10 md:py-12';

export default function HoldersStatsTile({
  eyebrow,
  headline,
  headlineAriaLabel,
  subtitle,
  footer,
  className,
}: HoldersStatsTileProps): ReactElement {
  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      <div className="font-[InterRegular] text-cherry-soda text-(length:--body-comfortable) uppercase tracking-wider">
        {eyebrow}
      </div>
      <div
        className="font-[InterBold] text-black text-(length:--app-title) leading-[1.1] mt-3"
        aria-label={headlineAriaLabel}
      >
        {headline}
      </div>
      {subtitle && (
        <div className="font-[InterRegular] text-espresso text-(length:--body-super-comfortable) leading-[1.4] mt-3 max-w-md">
          {subtitle}
        </div>
      )}
      {footer && (
        <div className="font-[InterRegular] text-cherry-bright text-(length:--body-comfortable) leading-[1.4] mt-4">
          {footer}
        </div>
      )}
    </div>
  );
}
