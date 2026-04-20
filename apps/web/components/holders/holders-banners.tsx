'use client';

import type { ReactElement, ReactNode } from 'react';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import LandingFullBanner from '@/components/landing/landing-full-banner';
import { DISCORD_ROUTE, X_ROUTE } from '@/constants/routes';
import { HOLDERS_FULL_BANNER, HOLDERS_IMAGE_BANNERS, HOLDERS_SHORT_BANNERS } from './holders-banners-content';

const [grantsBanner, burnsBanner] = HOLDERS_SHORT_BANNERS;
const [icxBanner, stakeBanner] = HOLDERS_IMAGE_BANNERS;

interface ImageBannerProps {
  theme: 'dark' | 'light';
  title: ReactNode;
  subtitle: ReactNode;
  buttonLabel?: string;
  href?: string;
  imageSrc: string;
  imageClassName: string;
  containerClassName: string;
}

interface ShortBannerProps {
  theme: 'dark' | 'light';
  title: ReactNode;
  subtitle: ReactNode;
  buttonLabel?: string;
  href?: string;
  containerClassName: string;
}

const THEME_STYLES = {
  dark: {
    subtitle: "text-(length:--body-super-comfortable) font-['InterRegular'] text-white leading-[1.4] mt-2 text-center",
    buttonClassName: 'rounded-full cursor-pointer',
    buttonVariant: 'subtle' as const,
  },
  light: {
    subtitle: "text-(length:--body-super-comfortable) font-['InterRegular'] text-black mt-2 leading-[1.4] text-center",
    buttonClassName: "px-6 font-['InterMedium'] cursor-pointer",
    buttonVariant: 'outline' as const,
  },
};

const TITLE_CLASSNAME = "text-(length:--app-title) font-['InterBlack'] text-black leading-[1.1]";

const SHORT_BANNER_CONTAINER =
  'w-full lg:w-1/2 flex flex-col items-center justify-center px-8 bg-almost-white h-[240px] mt-4 relative';

const IMAGE_BANNER_CONTAINER_BASE =
  'w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-almost-white h-[440px] sm:h-[480px] md:h-[480px] mt-4 relative z-1';

const IMAGE_BANNER_IMAGE_CLASSNAME =
  'mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-150 z-0 max-w-150';

function ImageBanner({
  theme,
  title,
  subtitle,
  buttonLabel,
  href,
  imageSrc,
  imageClassName,
  containerClassName,
}: ImageBannerProps): ReactElement {
  const styles = THEME_STYLES[theme];

  return (
    <div className={containerClassName}>
      <Image className={imageClassName} src={imageSrc} alt="background" width={990} height={660} />
      <div className={TITLE_CLASSNAME}>{title}</div>
      <p className={styles.subtitle}>{subtitle}</p>
      {buttonLabel && (
        <div className="mt-6 z-10">
          <Button
            className={styles.buttonClassName}
            variant={styles.buttonVariant}
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

function ShortBanner({
  theme,
  title,
  subtitle,
  buttonLabel,
  href,
  containerClassName,
}: ShortBannerProps): ReactElement {
  const styles = THEME_STYLES[theme];

  return (
    <div className={containerClassName}>
      <div className={TITLE_CLASSNAME}>{title}</div>
      <p className={styles.subtitle}>{subtitle}</p>
      {buttonLabel && (
        <div className="mt-4 z-10">
          <Button
            className={styles.buttonClassName}
            variant={styles.buttonVariant}
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

export default function HoldersBanners(): ReactElement {
  return (
    <>
      {/* Full-width image banner */}
      <LandingFullBanner
        containerClassName="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-4 pt-14 md:pt-18 relative overflow-hidden"
        image={{
          src: HOLDERS_FULL_BANNER.imageSrc,
          alt: 'background',
          width: 990,
          height: 660,
          className: 'mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-150 max-w-150 z-0',
        }}
        title={
          <div className="flex items-center gap-4">
            <div className="text-(length:--main-title) font-['InterBlack'] text-black leading-[1.1]">
              {HOLDERS_FULL_BANNER.title}
            </div>
          </div>
        }
        subtitle={HOLDERS_FULL_BANNER.subtitle}
        buttonLabel={HOLDERS_FULL_BANNER.buttonLabel}
        href={HOLDERS_FULL_BANNER.href}
      />

      {/* Two short panels without buttons */}
      <div className="flex flex-col lg:flex-row">
        <ShortBanner theme="light" {...grantsBanner} containerClassName={SHORT_BANNER_CONTAINER} />
        <ShortBanner theme="light" {...burnsBanner} containerClassName={SHORT_BANNER_CONTAINER} />
      </div>

      {/* Pair of light-theme image banners */}
      <div className="flex flex-col lg:flex-row">
        <ImageBanner
          theme="light"
          {...icxBanner}
          imageClassName={IMAGE_BANNER_IMAGE_CLASSNAME}
          containerClassName={IMAGE_BANNER_CONTAINER_BASE}
        />
        <ImageBanner
          theme="light"
          {...stakeBanner}
          imageClassName={IMAGE_BANNER_IMAGE_CLASSNAME}
          containerClassName={`${IMAGE_BANNER_CONTAINER_BASE} lg:ml-4`}
        />
      </div>

      {/* Join the movement — full-width dark banner with two CTAs */}
      <div className="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-cherry-soda mt-4 pt-14 md:pt-18 relative overflow-hidden isolate">
        <Image
          className="mix-blend-screen absolute -bottom-41 left-1/2 transform -translate-x-1/2 w-[880px] max-w-none pointer-events-none"
          src="/soda-burn.png"
          alt="background"
          width={880}
          height={880}
        />
        <div className="flex flex-col items-center gap-6 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="text-(length:--main-title) font-['InterBlack'] text-yellow-soda leading-[1.1] text-center">
              Join the movement.
            </div>
            <div className="text-(length:--subtitle) font-['InterRegular'] text-cream leading-[1.2] text-center">
              The SODA holders community is growing. You can too.
            </div>
          </div>
          <div className="flex gap-4">
            <a
              href={X_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="border-4 border-cherry-bright h-10 px-6 flex items-center justify-center font-['InterRegular'] rounded-full text-[14px] cursor-pointer text-white hover:bg-cherry-bright/10 transition-colors"
            >
              Follow on X
            </a>
            <a
              href={DISCORD_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="border-4 border-cherry-bright h-10 px-6 flex items-center justify-center font-['InterRegular'] rounded-full text-[14px] cursor-pointer text-white hover:bg-cherry-bright/10 transition-colors"
            >
              Join the Discord
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
