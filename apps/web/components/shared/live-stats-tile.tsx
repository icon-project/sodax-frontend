'use client';

import type { ReactElement, ReactNode } from 'react';

import Image from 'next/image';

import { cn } from '@/lib/utils';

export interface LiveStatsTileProps {
  title: ReactNode;
  primary: ReactNode;
  primaryAriaLabel?: string;
  primarySubtitle?: ReactNode;
  body: ReactNode;
  footerIcon: ReactNode;
  footer: ReactNode;
  className?: string;
}

const CONTAINER_CLASS =
  'flex flex-col gap-4 justify-end items-start bg-cream-white rounded-3xl pt-14 pb-8 px-8 self-stretch';

const TITLE_CLASS = "font-['InterBold'] text-espresso text-(length:--subtitle) leading-[1.2]";

const PRIMARY_CLASS = "font-['InterBold'] text-espresso text-(length:--subtitle) leading-[1.2] whitespace-nowrap";

const PRIMARY_SUBTITLE_CLASS = "font-['InterRegular'] text-clay text-(length:--body-small) leading-[1.4]";

const BODY_CLASS = "font-['InterRegular'] text-clay text-(length:--body-comfortable) leading-[1.4]";

const FOOTER_CLASS = "font-['InterRegular'] text-espresso text-(length:--body-small) leading-[1.4]";

export default function LiveStatsTile({
  title,
  primary,
  primaryAriaLabel,
  primarySubtitle,
  body,
  footerIcon,
  footer,
  className,
}: LiveStatsTileProps): ReactElement {
  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      <p className={TITLE_CLASS}>{title}</p>

      <div className="flex gap-4 items-center">
        <div className="h-12 w-0.5 bg-espresso/30 shrink-0" aria-hidden="true" />
        <div className="flex flex-col items-start">
          <div className="flex gap-1 items-center">
            <Image src="/soda-yellow-on-cherry.svg" alt="" width={16} height={16} className="size-4 shrink-0" />
            <span className={PRIMARY_CLASS} aria-label={primaryAriaLabel}>
              {primary}
            </span>
          </div>
          {primarySubtitle && <span className={PRIMARY_SUBTITLE_CLASS}>{primarySubtitle}</span>}
        </div>
      </div>

      <p className={BODY_CLASS}>{body}</p>

      <div className="h-0.5 w-full bg-espresso/30" aria-hidden="true" />

      <div className="flex gap-1 items-center">
        <span className="text-espresso shrink-0 inline-flex items-center" aria-hidden="true">
          {footerIcon}
        </span>
        <span className={FOOTER_CLASS}>{footer}</span>
      </div>
    </div>
  );
}
