'use client';

import type { ReactElement, ReactNode } from 'react';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface HoldersFullBannerProps {
  title: ReactNode;
  subtitle: ReactNode;
  buttonLabel: string;
  href: string;
  imageSrc: string;
  containerClassName: string;
}

export default function HoldersFullBanner({
  title,
  subtitle,
  buttonLabel,
  href,
  imageSrc,
  containerClassName,
}: HoldersFullBannerProps): ReactElement {
  return (
    <div className={containerClassName}>
      <Image
        className="mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-150 max-w-150 z-0"
        src={imageSrc}
        alt="background"
        width={990}
        height={660}
      />
      <div className="text-(length:--main-title) font-['InterBlack'] text-black leading-[1.1]">{title}</div>
      <p className="text-(length:--subtitle) font-['InterRegular'] text-espresso mt-2 leading-[1.2]">{subtitle}</p>
      <div className="mt-6 z-5">
        <Button
          variant="outline"
          className="px-6 font-['InterMedium'] cursor-pointer text-(length:--body-comfortable)"
          size="lg"
          onClick={() => window.open(href, '_blank')}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
