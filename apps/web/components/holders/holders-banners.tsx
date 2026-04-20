'use client';

import type { ReactElement, ReactNode } from 'react';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LandingFullBanner from '@/components/landing/landing-full-banner';
import { ArrowRightIcon } from '@/components/icons/arrow-right-icon';
import { DISCORD_ROUTE, MIGRATE_ROUTE, SODA_TOKEN_ROUTE, STAKE_ROUTE, X_ROUTE } from '@/constants/routes';

interface ImageBannerProps {
  theme: 'dark' | 'light';
  title: ReactNode;
  subtitle: string;
  buttonLabel: string;
  href: string;
  imageSrc: string;
  imageClassName: string;
  containerClassName: string;
}

interface ShortBannerProps {
  theme: 'dark' | 'light';
  title: ReactNode;
  subtitle: string;
  buttonLabel: string;
  href: string;
  containerClassName: string;
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
      <div className="flex items-center">{title}</div>
      <Label className={styles.subtitle}>{subtitle}</Label>
      <div className="mt-6 z-10">
        <Button
          className={styles.buttonClassName}
          variant={styles.buttonVariant}
          size="lg"
          onClick={() => window.open(href, '_blank')}
        >
          {buttonLabel}
        </Button>
      </div>
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
      <div className="flex items-center">{title}</div>
      <Label className={styles.subtitle}>{subtitle}</Label>
      <div className="mt-4 z-10">
        <Button
          className={styles.buttonClassName}
          variant={styles.buttonVariant}
          size="lg"
          onClick={() => window.open(href, '_blank')}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

export default function HoldersBanners(): ReactElement {
  return (
    <>
      {/* Full-width image banner (placeholder: same pattern as landing) */}
      <LandingFullBanner
        containerClassName="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-4 pt-14 md:pt-18 relative overflow-hidden"
        topDecorator={
          <ArrowRightIcon className="absolute top-[-32px] left-1/2 -translate-x-1/2 rotate-270" fill="white" />
        }
        image={{
          src: '/sodax-mockup.png',
          alt: 'background',
          width: 990,
          height: 660,
          className:
            'mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-150 max-w-150 z-0',
        }}
        title={
          <div className="flex items-center gap-4">
            <Image
              src="/soda-yellow-sm.png"
              alt="SODAX Symbol"
              width={32}
              height={32}
              className="md:w-8 md:h-8 w-6 h-6"
            />
            <div className="text-(length:--main-title) font-['InterBlack'] text-black leading-[1.1]">
              Supply capped at 1.5B.{' '}
            </div>
          </div>
        }
        subtitle="No emissions, zero inflation guaranteed."
        buttonLabel="Tokenomics"
        href={SODA_TOKEN_ROUTE}
      />

      {/* Two short (~240px) panels without images */}
      <div className="flex flex-col lg:flex-row">
        <ShortBanner
          theme="light"
          title={
            <div className="text-(length:--app-title) font-['InterBlack'] text-black leading-[1.1]">
              ...and grows the protocol.{' '}
            </div>
          }
          subtitle="A stronger DAO to govern ever growing liquidity. Diving trade and rewarding stakers."
          buttonLabel="Read more"
          href="#"
          containerClassName="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 bg-almost-white h-[240px] mt-4 relative"
        />
        <ShortBanner
          theme="light"
          title={
            <div className="text-(length:--app-title) font-['InterBlack'] text-black leading-[1.1]">
              Every swap burns SODA...{' '}
            </div>
          }
          subtitle="Partners across 18 networks collect fees. Buying back SODA and reducing supply."
          buttonLabel="Read more"
          href="#"
          containerClassName="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 bg-almost-white h-[240px] mt-4 relative"
        />
      </div>

      {/* Pair of light-theme image banners */}
      <div className="flex flex-col lg:flex-row">
        <ImageBanner
          theme="light"
          title={
            <div className="text-(length:--app-title) font-['InterBlack'] text-black leading-[1.1]">
              Already an ICX holder?{' '}
            </div>
          }
          subtitle="Migrate 1:1 from ICX to SODA.  Same community, fresh tokenomics."
          buttonLabel="Migrate to SODA"
          href={MIGRATE_ROUTE}
          imageSrc="/sodax-mockup.png"
          containerClassName="w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-almost-white h-[440px] sm:h-[480px] md:h-[560px] mt-4 relative z-1"
          imageClassName="mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-150 z-0 max-w-150"
        />
        <ImageBanner
          theme="light"
          title={
            <div className="text-(length:--app-title) font-['InterBlack'] text-black leading-[1.1]">
              Your share of fees.
            </div>
          }
          subtitle="Stake SODA and earn from protocol growth. 20% of fees flow to holders."
          buttonLabel="Stake SODA"
          href={STAKE_ROUTE}
          imageSrc="/sodax-mockup.png"
          containerClassName="w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-almost-white h-[440px] sm:h-[480px] md:h-[560px] mt-4 lg:ml-4 relative z-1"
          imageClassName="mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-150 z-0 max-w-150"
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
