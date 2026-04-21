'use client';

import type { ReactElement, ReactNode } from 'react';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import HoldersFullBanner from '@/components/holders/holders-full-banner';
import HoldersJoinBanner from '@/components/holders/holders-join-banner';
import { HOLDERS_FULL_BANNER, HOLDERS_IMAGE_BANNERS, HOLDERS_SHORT_BANNERS } from './holders-banners-content';

interface ImageBannerProps {
  title: ReactNode;
  subtitle: ReactNode;
  buttonLabel?: string;
  href?: string;
  imageSrc: string;
  imageClassName: string;
  containerClassName: string;
}

interface ShortBannerProps {
  title: ReactNode;
  subtitle: ReactNode;
  containerClassName: string;
}

const TITLE_CLASSNAME = "text-(length:--app-title) font-['InterBold'] text-black leading-[1.1]";

const SUBTITLE_CLASSNAME =
  "text-(length:--body-super-comfortable) font-['InterRegular'] text-espresso mt-2 leading-[1.4] text-center";

const BUTTON_CLASSNAME = "px-6 font-['InterMedium'] cursor-pointer";

const SHORT_BANNER_CONTAINER =
  'w-full lg:w-1/2 flex flex-col items-center justify-center px-8 bg-almost-white h-[240px] mt-4 relative';

const IMAGE_BANNER_CONTAINER_BASE =
  'w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-almost-white h-[440px] sm:h-[480px] md:h-[480px] mt-4 relative z-1';

const IMAGE_BANNER_IMAGE_CLASSNAME =
  'mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-150 z-0 max-w-150';

function ImageBanner({
  title,
  subtitle,
  buttonLabel,
  href,
  imageSrc,
  imageClassName,
  containerClassName,
}: ImageBannerProps): ReactElement {
  return (
    <div className={containerClassName}>
      <Image className={imageClassName} src={imageSrc} alt="background" width={990} height={660} />
      <div className={TITLE_CLASSNAME}>{title}</div>
      <p className={SUBTITLE_CLASSNAME}>{subtitle}</p>
      {buttonLabel && (
        <div className="mt-6 z-10">
          <Button
            className={BUTTON_CLASSNAME}
            variant="outline"
            size="lg"
            onClick={() => href && window.open(href, '_blank')}
          >
            {buttonLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

function ShortBanner({ title, subtitle, containerClassName }: ShortBannerProps): ReactElement {
  return (
    <div className={containerClassName}>
      <div className={TITLE_CLASSNAME}>{title}</div>
      <p className={SUBTITLE_CLASSNAME}>{subtitle}</p>
    </div>
  );
}

export default function HoldersBanners(): ReactElement {
  return (
    <>
      <HoldersFullBanner
        containerClassName="h-[440px] sm:h-[480px] md:h-[480px] flex flex-col items-center bg-almost-white mt-4 pt-14 md:pt-18 relative overflow-hidden"
        imageSrc={HOLDERS_FULL_BANNER.imageSrc}
        title={HOLDERS_FULL_BANNER.title}
        subtitle={HOLDERS_FULL_BANNER.subtitle}
        buttonLabel={HOLDERS_FULL_BANNER.buttonLabel}
        href={HOLDERS_FULL_BANNER.href}
      />

      <div className="flex flex-col lg:flex-row">
        {HOLDERS_SHORT_BANNERS.map((banner, index) => (
          <ShortBanner
            key={index}
            {...banner}
            containerClassName={`${SHORT_BANNER_CONTAINER} ${index > 0 ? 'lg:ml-4' : ''}`}
          />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row">
        {HOLDERS_IMAGE_BANNERS.map((banner, index) => (
          <ImageBanner
            key={index}
            {...banner}
            imageClassName={IMAGE_BANNER_IMAGE_CLASSNAME}
            containerClassName={`${IMAGE_BANNER_CONTAINER_BASE} ${index > 0 ? 'lg:ml-4' : ''}`}
          />
        ))}
      </div>

      <HoldersJoinBanner />
    </>
  );
}
