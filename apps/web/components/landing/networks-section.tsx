'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { ArrowRightIcon } from '../icons/arrow-right-icon';
import { Element } from 'react-scroll';

const NetworksSection = () => {
  return (
    <Element
      className="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-4 pt-14 md:pt-18 relative overflow-hidden"
      name="networks"
    >
      <ArrowRightIcon className="absolute top-[-32px] left-1/2 -translate-x-1/2 rotate-270" fill="white" />
      <Image
        className="mix-blend-multiply absolute bottom-15 md:bottom-18 lg:bottom-19 left-1/2 transform -translate-x-1/2 h-[209px] md:w-[681px] max-w-[681px]"
        src="/networks.png"
        alt="background"
        width={681}
        height={267}
      />
      <div className="flex items-center gap-4">
        <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
        <div className="text-(length:--main-title) font-['InterBlack'] text-black leading-[1.1]">
          DeFi without borders
        </div>
      </div>
      <Label className="text-(length:--subtitle) font-[InterRegular] text-black mt-2 leading-[1.2]">
        Across EVM and beyond.
      </Label>
      <div className="mt-4">
        <Button
          variant="outline"
          className="px-6 font-['InterMedium'] cursor-pointer text-(length:--body-comfortable)"
          size="lg"
          onClick={() => window.open('https://x.com/intent/user?screen_name=gosodax', '_blank')}
        >
          Follow us for launch
        </Button>
      </div>
    </Element>
  );
};

export default NetworksSection;
