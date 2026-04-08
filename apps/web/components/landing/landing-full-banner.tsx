'use client';

import type { ReactElement, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Element } from 'react-scroll';

interface LandingFullBannerProps {
  title: ReactNode;
  subtitle: string;
  buttonLabel: string;
  href: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className: string;
  };
  containerClassName: string;
  topDecorator?: ReactNode;
  scrollName?: string;
  buttonClassName?: string;
}

export default function LandingFullBanner(props: LandingFullBannerProps): ReactElement {
  const { title, subtitle, buttonLabel, href, image, containerClassName, topDecorator, scrollName, buttonClassName } =
    props;

  const content = (
    <>
      {topDecorator}
      <Image className={image.className} src={image.src} alt={image.alt} width={image.width} height={image.height} />
      {title}
      <Label className="text-(length:--subtitle) font-[InterRegular] text-black mt-2 leading-[1.2]">{subtitle}</Label>
      <div className="mt-6 z-5">
        <Button
          variant="outline"
          className={buttonClassName ?? "px-6 font-['InterMedium'] cursor-pointer text-(length:--body-comfortable)"}
          size="lg"
          onClick={() => window.open(href, '_blank')}
        >
          {buttonLabel}
        </Button>
      </div>
    </>
  );

  if (scrollName) {
    return (
      <Element className={containerClassName} name={scrollName}>
        {content}
      </Element>
    );
  }

  return <div className={containerClassName}>{content}</div>;
}
