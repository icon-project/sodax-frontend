'use client';

import type { ReactElement, ReactNode } from 'react';

import LandingFullBanner from '@/components/landing/landing-full-banner';
import { ArrowRightIcon } from '@/components/icons/arrow-right-icon';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LANDING_FULL_BANNERS, LANDING_SMALL_BANNERS } from './landing-banners-content';

const [integrationBanner, executionStackBanner] = LANDING_FULL_BANNERS;
const [buildersBanner, partnersBanner, migrateBanner, tokenBanner] = LANDING_SMALL_BANNERS;

interface SmallBannerProps {
  theme: 'dark' | 'light';
  title: ReactNode;
  subtitle: string;
  buttonLabel: string;
  href: string;
  imageSrc: string;
  imageClassName: string;
  containerClassName: string;
  extraImages?: ReadonlyArray<{ src: string; className: string; width: number; height: number }>;
}

const THEME_STYLES = {
  dark: {
    subtitle: "text-(length:--body-super-comfortable) font-['InterRegular'] text-white leading-[1.4] mt-2 font-normal",
    buttonClassName: 'rounded-full cursor-pointer',
    buttonVariant: 'subtle' as const,
  },
  light: {
    subtitle: "text-(length:--body-super-comfortable) font-['InterRegular'] text-black mt-2 leading-[1.2]",
    buttonClassName: "px-6 font-['InterMedium'] cursor-pointer",
    buttonVariant: 'outline' as const,
  },
};

function SmallBanner({ theme, title, subtitle, buttonLabel, href, imageSrc, imageClassName, containerClassName, extraImages }: SmallBannerProps): ReactElement {
  const styles = THEME_STYLES[theme];

  return (
    <div className={containerClassName}>
      {extraImages?.map(img => (
        <Image key={img.src} className={img.className} src={img.src} alt="background" width={img.width} height={img.height} />
      ))}
      <Image className={imageClassName} src={imageSrc} alt="background" width={990} height={660} />
      <div className="flex items-center">{title}</div>
      <Label className={styles.subtitle}>{subtitle}</Label>
      <div className="mt-6 z-10">
        <Button className={styles.buttonClassName} variant={styles.buttonVariant} size="lg" onClick={() => window.open(href, '_blank')}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

function SmallBannerRow({ left, right }: { left: SmallBannerProps; right: SmallBannerProps }): ReactElement {
  return (
    <div className="flex flex-col lg:flex-row">
      <SmallBanner {...left} />
      <SmallBanner {...right} />
    </div>
  );
}

export default function LandingBanners(): ReactElement {
  return (
    <>
      {/* Cross-network development */}
      <LandingFullBanner
        scrollName="networks"
        containerClassName="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-4 pt-14 md:pt-18 relative overflow-hidden"
        topDecorator={
          <ArrowRightIcon className="absolute top-[-32px] left-1/2 -translate-x-1/2 rotate-270" fill="white" />
        }
        image={{
          src: integrationBanner.imageSrc,
          alt: 'background',
          width: 681,
          height: 267,
          className:
            'mix-blend-multiply absolute bottom-15 md:bottom-18 lg:bottom-19 left-1/2 transform -translate-x-1/2 h-[209px] md:w-[681px] max-w-[681px]',
        }}
        title={
          <div className="flex items-center gap-4">
            <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
            <div className="text-(length:--main-title) font-['InterBlack'] text-black leading-[1.1]">
              {integrationBanner.title}
            </div>
          </div>
        }
        subtitle={integrationBanner.subtitle}
        buttonLabel={integrationBanner.buttonLabel}
        href={integrationBanner.href}
        buttonClassName="px-6 font-['InterMedium'] cursor-pointer text-(length:--body-comfortable)"
      />

      {/* Your scalable execution stack */}
      <LandingFullBanner
        containerClassName="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-4 pt-14 md:pt-18 relative section2"
        image={{
          src: executionStackBanner.imageSrc,
          alt: 'background',
          width: 850,
          height: 660,
          className:
            'mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[632px] md:w-[765px] max-w-[765px] z-0',
        }}
        title={
          <div className="flex items-center gap-4">
            <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
            <div className="text-center justify-center">{executionStackBanner.title}</div>
          </div>
        }
        subtitle={executionStackBanner.subtitle}
        buttonLabel={executionStackBanner.buttonLabel}
        href={executionStackBanner.href}
        buttonClassName="px-6 font-['InterMedium'] cursor-pointer text-(length:--body-comfortable)"
      />

      {/* Builders + SODA Token */}
      <SmallBannerRow
        left={{
          theme: 'dark',
          title: (
            <>
              <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
              <span className="text-yellow-soda text-(length:--app-title) font-bold font-['InterRegular'] leading-[1.1] ml-2">
                {buildersBanner.title}
              </span>
            </>
          ),
          subtitle: buildersBanner.subtitle,
          buttonLabel: buildersBanner.buttonLabel,
          href: buildersBanner.href,
          imageSrc: buildersBanner.imageSrc,
          containerClassName:
            'w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-cherry-soda h-[440px] sm:h-[480px] md:h-[480px] mt-4 relative overflow-hidden',
          imageClassName:
            'mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[561px] sm:w-[561px] max-w-[561px]',
        }}
        right={{
          theme: 'dark',
          title: (
            <span className="text-yellow-soda text-(length:--app-title) font-bold font-['InterRegular'] leading-[1.1]">
              {tokenBanner.title}
            </span>
          ),
          subtitle: tokenBanner.subtitle,
          buttonLabel: tokenBanner.buttonLabel,
          href: tokenBanner.href,
          imageSrc: tokenBanner.imageSrc,
          containerClassName:
            'w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-cherry-soda h-[440px] sm:h-[480px] md:h-[480px] mt-4 lg:ml-4 relative overflow-hidden',
          imageClassName:
            'mix-blend-screen absolute -bottom-22 left-1/2 transform -translate-x-1/2 w-[793px] max-w-[793px]',
        }}
      />

      {/* Migrate + Partners (same tile styling as before; only column positions swapped) */}
      <SmallBannerRow
        left={{
          theme: 'light',
          title: (
            <div className="flex items-center gap-4">
              <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
              <div className="text-(length:--app-title) font-['InterRegular'] font-bold text-black leading-[1.1]">
                {migrateBanner.title}
              </div>
            </div>
          ),
          subtitle: migrateBanner.subtitle,
          buttonLabel: migrateBanner.buttonLabel,
          href: migrateBanner.href,
          imageSrc: migrateBanner.imageSrc,
          containerClassName:
            'w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-almost-white h-[440px] sm:h-[480px] md:h-[480px] mt-4 relative z-1',
          imageClassName:
            'mix-blend-multiply absolute bottom-0 md:bottom-0 left-1/2 transform -translate-x-1/2 w-150 z-0 max-w-150',
        }}
        right={{
          theme: 'dark',
          title: (
            <div className="flex items-center gap-4">
              <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
              <div className="text-center justify-center">{partnersBanner.title}</div>
            </div>
          ),
          subtitle: partnersBanner.subtitle,
          buttonLabel: partnersBanner.buttonLabel,
          href: partnersBanner.href,
          imageSrc: partnersBanner.imageSrc,
          extraImages: [
            {
              src: '/circle1.png',
              className: 'mix-blend-multiply absolute bottom-[-280px] left-1/2 transform -translate-x-1/2 w-[737px] z-2',
              width: 737,
              height: 737,
            },
          ],
          containerClassName:
            'w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 h-[440px] sm:h-[480px] md:h-[480px] mt-4 lg:ml-4 bg-cherry-soda relative z-1 overflow-hidden',
          imageClassName:
            'mix-blend-screen absolute bottom-[-56px] left-1/2 transform -translate-x-1/2 w-[848px] max-w-[848px] z-3',
        }}
      />
    </>
  );
}
