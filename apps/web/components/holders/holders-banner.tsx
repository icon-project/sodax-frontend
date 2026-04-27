'use client';

import type { ReactElement } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { HoldersBannerWithButton, HoldersShortBanner } from './holders-banners-content';

type BannerVariant = 'full' | 'split';

export type HoldersBannerProps = { variant: BannerVariant; onCtaClick?: () => void } & (
  | HoldersBannerWithButton
  | HoldersShortBanner
);

const CONTAINER_BASE = 'flex flex-col items-center bg-almost-white mt-4 relative';

const CONTAINER_WIDTH: Record<BannerVariant, string> = {
  full: 'w-full overflow-hidden',
  split: 'w-full lg:w-1/2 z-10',
};

const TALL_LAYOUT: Record<BannerVariant, string> = {
  full: 'h-[424px] pt-18',
  split: 'h-[440px] sm:h-[480px] md:h-[480px] pt-14 md:pt-18',
};
const SHORT_LAYOUT = 'h-[240px] justify-center px-8';

const TITLE_STYLE: Record<BannerVariant, string> = {
  full: "text-(length:--main-title) font-['InterBlack'] text-black leading-[1.1]",
  split: "text-(length:--app-title) font-['InterBold'] text-black leading-[1.1]",
};

const SUBTITLE_STYLE: Record<BannerVariant, string> = {
  full: "text-(length:--subtitle) font-['InterRegular'] text-espresso mt-2 leading-[1.2]",
  split: "text-(length:--body-super-comfortable) font-['InterRegular'] text-espresso mt-2 leading-[1.4] text-center",
};

const BUTTON_STYLE: Record<BannerVariant, string> = {
  full: "px-6 font-['InterMedium'] cursor-pointer text-(length:--body-comfortable)",
  split: "px-6 font-['InterMedium'] cursor-pointer",
};

const BANNER_IMAGE_CLASSNAME: Record<BannerVariant, string> = {
  full: 'absolute bottom-0 left-1/2 -translate-x-1/2 w-[468px] h-[212px] overflow-hidden z-0',
  split: 'mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-150 max-w-150 z-0',
};

export default function HoldersBanner(props: HoldersBannerProps): ReactElement {
  const { variant, title, subtitle, onCtaClick } = props;
  const hasMedia = 'cta' in props;
  const showTexture = variant === 'full' && hasMedia;

  return (
    <div className={cn(CONTAINER_BASE, CONTAINER_WIDTH[variant], hasMedia ? TALL_LAYOUT[variant] : SHORT_LAYOUT)}>
      {showTexture && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 -scale-y-100 z-0">
          <div className="relative w-[800px] h-[800px] max-w-none">
            <Image src="/landing/concentric-rays-outer.svg" alt="" fill className="object-contain" />
            <Image
              src="/landing/concentric-rays-inner.svg"
              alt=""
              width={472}
              height={472}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[7.55deg]"
            />
          </div>
        </div>
      )}
      {hasMedia && variant === 'full' && (
        <div className={BANNER_IMAGE_CLASSNAME.full}>
          <Image
            fill
            sizes="468px"
            className="mix-blend-multiply object-cover object-top"
            src={props.imageSrc}
            alt=""
          />
        </div>
      )}
      {hasMedia && variant === 'split' && (
        <Image className={BANNER_IMAGE_CLASSNAME.split} src={props.imageSrc} alt="" width={990} height={660} />
      )}
      <div className={cn(TITLE_STYLE[variant], 'z-10')}>{title}</div>
      <p className={cn(SUBTITLE_STYLE[variant], 'z-10')}>{subtitle}</p>
      {hasMedia && (
        <div className="mt-6 z-10">
          {props.cta.tooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" size="lg" className={BUTTON_STYLE[variant]}>
                  <Link href={props.cta.href} onClick={onCtaClick}>
                    {props.cta.label}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                variant="bubble"
                side="top"
                sideOffset={16}
                className="h-[54px] items-center gap-2 px-8 py-4 text-(length:--body-comfortable)"
              >
                <span className="flex items-center">{props.cta.tooltip}</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button asChild variant="outline" size="lg" className={BUTTON_STYLE[variant]}>
              <Link href={props.cta.href} onClick={onCtaClick}>
                {props.cta.label}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
