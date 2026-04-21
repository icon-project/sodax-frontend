import type { ReactElement } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HoldersBannerWithButton, HoldersShortBanner } from './holders-banners-content';

type BannerVariant = 'full' | 'split';

export type HoldersBannerProps = { variant: BannerVariant } & (HoldersBannerWithButton | HoldersShortBanner);

const CONTAINER_BASE = 'flex flex-col items-center bg-almost-white mt-4 relative';

const CONTAINER_WIDTH: Record<BannerVariant, string> = {
  full: 'w-full overflow-hidden',
  split: 'w-full lg:w-1/2 z-10',
};

const TALL_LAYOUT = 'h-[440px] sm:h-[480px] md:h-[480px] pt-14 md:pt-18';
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

const BANNER_IMAGE_CLASSNAME =
  'mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-150 max-w-150 z-0';

export default function HoldersBanner(props: HoldersBannerProps): ReactElement {
  const { variant, title, subtitle } = props;
  const hasMedia = 'cta' in props;

  return (
    <div className={cn(CONTAINER_BASE, CONTAINER_WIDTH[variant], hasMedia ? TALL_LAYOUT : SHORT_LAYOUT)}>
      {hasMedia && (
        <Image className={BANNER_IMAGE_CLASSNAME} src={props.imageSrc} alt="" width={990} height={660} />
      )}
      <div className={TITLE_STYLE[variant]}>{title}</div>
      <p className={SUBTITLE_STYLE[variant]}>{subtitle}</p>
      {hasMedia && (
        <div className="mt-6 z-10">
          <Button asChild variant="outline" size="lg" className={BUTTON_STYLE[variant]}>
            <Link href={props.cta.href}>{props.cta.label}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
